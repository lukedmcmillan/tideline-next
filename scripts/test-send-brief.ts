// scripts/test-send-brief.ts
// Direct test of send-brief pipeline for two users — runs outside HTTP server.
// Usage: node_modules/.bin/tsx scripts/test-send-brief.ts
// Sends real emails via Resend to both test accounts.

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import {
  compileBriefHtml,
  type BriefData,
  type BriefUser,
  type LeadItem,
  type ConditionRow,
  type WatchEvent,
} from '../app/lib/brief/template';
import {
  selectLead, selectConditions, selectEvidence,
  selectWhatToWatch, selectAcrossSector,
  type StoryRow, type TrackerScoreRow, type GovernanceEventRow,
} from '../app/lib/brief/select';
import { selectQuickAsk, type QuickAskContext } from '../app/lib/brief/quick-asks';
import {
  generateSignOff, currentWeekday, fmtDate, isoWeekNumber,
  TRACKER_TO_TOPICS, STATIC_WORK_REVEALED,
} from '../app/lib/brief/utils';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BriefPool {
  candidate_stories:   StoryRow[];
  all_tracker_scores:  TrackerScoreRow[];
  all_events:          GovernanceEventRow[];
  work_revealed_count: { sources: number; candidate_count: number; filtered_count: number };
  generated_at:        string;
}

// Must stay in sync with buildSubject in app/api/cron/send-brief/route.ts
function buildSubject(lead: LeadItem, conditions: ConditionRow[], events: WatchEvent[]): string {
  const rawHeadline = (lead.type === 'state' && (lead as any).subjectHeadline
    ? (lead as any).subjectHeadline
    : lead.headline
  ).replace(/\.$/, '').trim();
  // Determine suffix first; cap headline so headline + suffix ≤ 80 chars.
  const headlineHasPulse = /Pulse \d+\.?\d*/i.test(rawHeadline);
  let suffix = '';
  if (headlineHasPulse) {
    suffix = events.length > 0 ? ` · ${events[0].dayLabel}` : '';
  } else {
    const elevated = conditions.find(c => c.band === 'ELEVATED');
    if (elevated) suffix = ` · Pulse ${elevated.score.toFixed(1)}`;
    else if (events.length > 0) suffix = ` · ${events[0].dayLabel}`;
  }
  const maxHeadline = 80 - suffix.length;
  const headline = rawHeadline.length > maxHeadline
    ? rawHeadline.slice(0, maxHeadline).replace(/\s\S+$/, '').trim()
    : rawHeadline;
  return `${headline}${suffix}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Tideline <luke@thetideline.co>',
      reply_to: 'brief-replies@thetideline.co',
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`  Resend error ${res.status}: ${body}`);
  }
  return res.ok;
}

async function runForUser(
  pool: BriefPool,
  userEmail: string,   // DB lookup email (real user with real topics)
  sendToEmail: string, // actual Resend recipient (may differ for test routing)
  today: string,
  dateStr: string,
  weekday: NonNullable<ReturnType<typeof currentWeekday>>,
  weekNum: number,
): Promise<void> {
  // Fetch user from DB
  const { data: user } = await supabase
    .from('users')
    .select('id, email, unsubscribe_token, topics')
    .eq('email', userEmail)
    .single();

  if (!user) {
    console.log(`  User not found: ${userEmail}`);
    return;
  }

  const userTopics: string[] = Array.isArray(user.topics) ? user.topics : [];
  console.log(`  Topics: [${userTopics.join(', ')}]`);

  // isFirstBrief
  const { data: prevSends } = await supabase
    .from('brief_sends')
    .select('id')
    .eq('user_id', user.id)
    .eq('send_type', 'production')
    .limit(1);
  const isFirstBrief = !prevSends || prevSends.length === 0;

  // Recently-led exclusion (matches route logic)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLeads } = await supabase
    .from('brief_sends')
    .select('lead_story_id')
    .eq('user_id', user.id)
    .not('lead_story_id', 'is', null)
    .gte('sent_at', sevenDaysAgo);
  const recentlyLedIds = new Set<string>(
    (recentLeads ?? []).map(r => (r as any).lead_story_id as string).filter(Boolean)
  );

  console.log(`  recentlyLedIds (last 7 days): [${[...recentlyLedIds].join(', ') || 'none'}]`);

  // Context
  const userStories = pool.candidate_stories.filter(s =>
    userTopics.length === 0 ||
    userTopics.some(t => (TRACKER_TO_TOPICS[t] || [t]).includes(s.topic))
  );
  const recentHighSigCount    = userStories.filter(s => (s.significance_score ?? 0) >= 7).length;
  const recentLowActivityWeek = userStories.length <= 3;
  const quickAskCtx: QuickAskContext = { isFirstBrief, recentHighSigCount, recentLowActivityWeek };

  // Selectors — pass recentlyLedIds to exclude repeat leads
  const lead         = selectLead(pool.candidate_stories, pool.all_tracker_scores, userTopics, recentlyLedIds);
  const conditions   = selectConditions(pool.all_tracker_scores, userTopics);
  const evidence     = selectEvidence(pool.candidate_stories, lead, userTopics);
  const whatToWatch  = selectWhatToWatch(pool.all_events, userTopics, 14);
  const acrossSector = selectAcrossSector(pool.candidate_stories, userTopics);
  const quickAsk     = selectQuickAsk(weekday, weekNum, quickAskCtx);
  const signOff      = generateSignOff(weekday);

  // ── Diagnostic output ──────────────────────────────────────────────────────
  const leadStoryId = (lead as any).storyId ?? null;
  console.log(`  lead.storyId:    ${leadStoryId ?? '(none — state fallback)'}`);
  console.log(`  lead.type:       ${lead.type}`);
  console.log(`  lead.headline:   ${lead.headline}`);
  console.log(`  Conditions: ${conditions.map(c => `${c.trackerLabel} ${c.score}`).join(' | ')}`);
  console.log(`  Evidence: ${evidence.length} items`);
  console.log(`  WhatToWatch: ${whatToWatch.length} events`);
  console.log(`  AcrossSector: ${acrossSector ? acrossSector.headline.slice(0, 50) : 'none'}`);
  console.log(`  isFirstBrief: ${isFirstBrief}, highSig: ${recentHighSigCount}, lowActivity: ${recentLowActivityWeek}`);

  if (leadStoryId && recentlyLedIds.has(leadStoryId)) {
    console.error(`  !! ERROR: lead.storyId is in recentlyLedIds — exclusion failed`);
  }

  const preheader = lead.interpretation.slice(0, 90).replace(/\n/g, ' ').trim();
  const briefData: BriefData = {
    dateStr, preheader, lead, conditions, evidence,
    whatToWatch, acrossSector, quickAsk,
    workRevealedLine: STATIC_WORK_REVEALED,
    signOff,
  };
  // Send to the override email (lukedmcmillan@hotmail.com) but render with
  // the real user's unsubscribe token so links are valid.
  const briefUser: BriefUser = {
    email: sendToEmail,
    unsubscribeToken: user.unsubscribe_token,
  };

  const html    = compileBriefHtml(briefData, briefUser);
  const subject = buildSubject(lead, conditions, whatToWatch);
  console.log(`  subject:         "${subject}"`);
  console.log(`  subject.length:  ${subject.length} chars`);
  if (subject.length > 80) console.error(`  !! WARN: subject exceeds 80 chars`);

  const ok = await sendEmail(sendToEmail, subject, html);
  console.log(`  Send: ${ok ? 'OK' : 'FAILED'}`);

  // Write to brief_sends with send_type='test_send' so the lead_story_id
  // column is exercised and can be verified in Supabase Studio.
  if (ok) {
    const topTrackerSlug = pool.all_tracker_scores
      .filter(t => userTopics.length === 0 || userTopics.includes(t.tracker_slug))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.tracker_slug ?? null;
    const { data: inserted, error: insErr } = await supabase
      .from('brief_sends')
      .insert({
        user_id:       user.id,
        email:         sendToEmail,
        story_count:   evidence.length,
        tracker_slug:  topTrackerSlug,
        send_type:     'test_send',
        brief_date:    today,
        lead_story_id: leadStoryId,
      })
      .select('id, lead_story_id')
      .single();
    if (insErr) {
      console.error(`  brief_sends insert error: ${insErr.message}`);
    } else {
      console.log(`  brief_sends row inserted: id=${inserted?.id}`);
      console.log(`  lead_story_id in DB:      ${inserted?.lead_story_id ?? 'NULL — column missing or null'}`);
      if (!inserted?.lead_story_id) {
        console.error(`  !! WARN: lead_story_id is null in brief_sends — migration may not be applied`);
      }
    }
  }
}

async function main() {
  const now      = new Date();
  const today    = now.toISOString().split('T')[0];
  const dateStr  = fmtDate(now);
  const weekday  = currentWeekday();
  const weekNum  = isoWeekNumber(now);

  if (!weekday) {
    console.log('Weekend — no brief. Forcing run for test purposes.');
    // Override for manual testing: use friday
  }
  const effectiveWeekday = weekday ?? 'friday';

  // Load pool
  const { data: buf } = await supabase
    .from('brief_buffer')
    .select('stories, story_count')
    .eq('date', today)
    .single();

  if (!buf || !buf.stories?.candidate_stories) {
    console.error(`No valid brief_buffer row for ${today}. Run generate-brief first.`);
    process.exit(1);
  }
  const pool = buf.stories as BriefPool;
  console.log(`Pool loaded: ${pool.candidate_stories.length} stories, ${pool.all_tracker_scores.length} trackers, ${pool.all_events.length} events`);
  console.log('');

  // ── Test send: look up main account topics, deliver to hotmail ──
  console.log('=== TEST SEND → lukedmcmillan@hotmail.com ===');
  await runForUser(pool, 'lukedmcmillan@gmail.com', 'lukedmcmillan@hotmail.com', today, dateStr, effectiveWeekday, weekNum);
}

main().catch(console.error);
