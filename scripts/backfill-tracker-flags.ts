/**
 * Dry-run backfill of stories.cross_tracker_flags using the updated score-significance prompt.
 *
 * PLAN-MODE-REQUIRED ZONE: writes to stories.cross_tracker_flags.
 * See CLAUDE-RULES.txt — this zone requires showing a diff count before any DB writes.
 *
 * Default mode (no flags): DRY RUN — re-scores and shows diffs. No DB writes.
 * --confirm: applies diffs to DB (run ONLY after reviewing dry-run output).
 * --limit N: cap stories to process (default: 500)
 * --days N: how many days back to scan (default: 30)
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-tracker-flags.ts
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-tracker-flags.ts --confirm
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-tracker-flags.ts --limit 100
 *
 * Source of truth for tracker definitions: PULSE_SCORE_METHODOLOGY.md §4 and §6.
 * This prompt must stay in lockstep with app/api/cron/score-significance/route.ts.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const args = process.argv.slice(2);
const CONFIRM   = args.includes('--confirm');
const limitArg  = args.find(a => a.startsWith('--limit=') || a === '--limit');
const LIMIT     = limitArg ? parseInt(args[args.indexOf('--limit') + 1] ?? limitArg.split('=')[1]) : 500;
const daysArg   = args.find(a => a.startsWith('--days=') || a === '--days');
const DAYS_BACK = daysArg ? parseInt(args[args.indexOf('--days') + 1] ?? daysArg.split('=')[1]) : 30;

// Haiku only — bulk processing per CLAUDE-RULES global instructions
const MODEL = 'claude-haiku-4-5-20251001';

// Valid slugs — must match route.ts whitelist and PULSE_SCORE_METHODOLOGY.md §4
const VALID_SLUGS = new Set([
  'bbnj', 'isa', 'iuu', '30x30', 'blue_finance', 'imo_shipping',
  'wto_fisheries', 'cites_marine', 'plastics', 'offshore_wind',
]);

// Source of truth: PULSE_SCORE_METHODOLOGY.md §4 Domain Thresholds and §6 Failure Modes.
// If the methodology changes, this prompt MUST change with it — they must stay in lockstep.
const SYSTEM_PROMPT = `You are an ocean governance significance scorer for Tideline. Score stories and assign tracker slugs. Return JSON only. No markdown. No explanation.

TRACKER SLUG DEFINITIONS
Verbatim from PULSE_SCORE_METHODOLOGY.md §4 Domain Thresholds. Prompt and methodology must stay in lockstep.

bbnj — BBNJ High Seas Treaty. Multilateral/complex. Covers the UN Agreement on Marine Biodiversity of Areas Beyond National Jurisdiction: ratification, implementation, signatory actions, ICP meetings, draft text negotiations, entry-into-force milestones. Calibrated threshold: 6.0. True positive rate: ~60%. Failure mode: Implementation phase signals are diffuse across 168 signatories.

isa — ISA Deep-Sea Mining. Multilateral/veto players. Covers the International Seabed Authority: council sessions, exploitation regulations, contractor licences, nodule/crust/sulphide extraction permits, mining code text, ISA Assembly decisions, and sponsoring state actions. Calibrated threshold: 6.5. True positive rate: ~65%. Failure mode: Commercial licensing runs structurally low due to confidential contractor communications. Do NOT assign isa solely because a story mentions "ocean floor" or "seabed" without an ISA regulatory link.

iuu — IUU Fishing Enforcement. Plurilateral. Covers illegal, unreported and unregulated fishing: port state control actions, flag state certifications, IUU vessel lists, carding decisions (EU, US, UK), RFMO enforcement, and high-seas boarding inspections. Calibrated threshold: 5.5. True positive rate: ~70%.

30x30 — 30x30 / MPA Designations. Varies by jurisdiction. Covers marine protected area designations, High Ambition Coalition commitments, national ocean targets aligned with the Kunming-Montreal GBF 30x30 goal, and CCAMLR MPA proposals. Calibrated threshold: 5.0. True positive rate: ~55-75%. Failure mode: Unilateral designations (US, UK) score well; multilateral MPA negotiations (CCAMLR) score poorly due to consensus veto dynamics.

blue_finance — Blue Finance / TNFD. Unilateral/framework body. Covers TNFD framework adoption, blue bonds, debt-for-nature swaps with an ocean component, ocean-linked sustainable finance instruments, and institutional investor ocean commitments. Calibrated threshold: 5.5. True positive rate: ~75%. Failure mode: Private transaction signals invisible. Do NOT assign blue_finance to fisheries infrastructure grants, port construction, or domestic maritime spending. Required test: is there a named financial instrument (bond, swap, fund) or named framework adoption (TNFD, IPSF, GBF finance target)?

imo_shipping — IMO Shipping Emissions. Plurilateral. Covers IMO MEPC sessions, GHG strategy revision, CII ratings, carbon intensity indicators, EEDI/EEXI regulations, alternative fuels framework, and flag state ratification of IMO instruments. Calibrated threshold: 6.0. True positive rate: ~70%. Failure mode: Flag state ratification divergence creates noise.

wto_fisheries — WTO Fisheries Subsidies. Multilateral/consensus. Covers the WTO Agreement on Fisheries Subsidies: implementation, ratification, Fish Two negotiations, capacity and overfishing provisions, dispute settlement. Agreement entered into force September 2025; Fish Two negotiations stalled. Calibrated threshold: 6.5. True positive rate: ~50%.

cites_marine — CITES Marine Species. Multilateral/CoP cycle. Covers CITES CoP decisions on shark species, rays, seahorses, queen conch, and other marine wildlife: listing proposals, implementation by range states, trade permit enforcement, intersessional working group outputs. Calibrated threshold: 6.5. True positive rate: ~65%. Failure mode: Signal concentrates around CoP dates, quiet between.

plastics — Plastics Treaty (INC). Multilateral/contested. Covers INC sessions of the UN treaty to end plastic pollution: draft text, national positions, veto coalition dynamics, extended producer responsibility provisions, and waste trade chapters. Calibrated threshold: 5.5. True positive rate: ~55%. Failure mode: Veto coalition dynamics poorly captured.

offshore_wind — Offshore Wind. Unilateral/national. Covers national offshore wind licensing, planning approvals, auction results, grid connection decisions, and port infrastructure for turbine installation. Calibrated threshold: 4.5. True positive rate: ~80%.

STRUCTURAL FAILURE MODES (verbatim from §6)
Failure Mode 1 — Consensus-blocked institutions: CCAMLR, ICCAT, and CBD COP generate high document volume regardless of outcome. High volume alone does not justify 30x30 assignment without a designation decision.
Failure Mode 3 — Confidential commercial transactions: ISA contractor activity, blue bond issuance, and debt-for-nature negotiations avoid public signal until completion. Do not inflate isa or blue_finance beyond what is document-visible.

ASSIGNMENT RULES
- Only assign a slug when the story directly and substantively affects that governance domain.
- When uncertain, assign zero trackers and score conservatively.`;

interface StoryRow {
  id: string;
  title: string;
  short_summary: string;
  cross_tracker_flags: string[] | null;
}

interface Diff {
  id: string;
  title: string;
  old_flags: string[];
  new_flags: string[];
  changed_from: string; // removed slugs
  changed_to: string;   // added slugs
}

async function rescoreStory(story: StoryRow): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: [{ type: 'text', text: SYSTEM_PROMPT }],
    messages: [{
      role: 'user',
      content: `Story headline: ${story.title}
Summary: ${story.short_summary}

Return this exact JSON: { "score": 0-100, "trackers": [] }
Valid tracker slugs: bbnj, isa, iuu, 30x30, blue_finance, imo_shipping, wto_fisheries, cites_marine, plastics, offshore_wind
Score: 0-30 = routine update, 31-60 = noteworthy, 61-75 = significant development, 76-100 = major policy shift
Only include slugs this story directly affects. Return only valid JSON.`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return Array.isArray(parsed.trackers)
    ? parsed.trackers.filter((t: string) => VALID_SLUGS.has(t))
    : [];
}

function flagsEqual(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb2 = new Set(b);
  if (sa.size !== sb2.size) return false;
  for (const v of sa) if (!sb2.has(v)) return false;
  return true;
}

async function main() {
  const mode = CONFIRM ? 'WRITE MODE' : 'DRY RUN';
  const since = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();

  console.log(`\n[backfill-tracker-flags] ${mode} — last ${DAYS_BACK} days, limit ${LIMIT}`);
  if (!CONFIRM) {
    console.log('[backfill-tracker-flags] Pass --confirm to apply diffs to DB.\n');
  }

  // Fetch stories: last N days, already scored, has summary
  const { data: stories, error } = await sb
    .from('stories')
    .select('id, title, short_summary, cross_tracker_flags')
    .gte('published_at', since)
    .gt('significance_score', 0)
    .not('short_summary', 'is', null)
    .order('published_at', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error('[backfill-tracker-flags] Fetch error:', error.message);
    process.exit(1);
  }

  console.log(`[backfill-tracker-flags] Fetched ${stories?.length ?? 0} stories to re-score.\n`);

  const diffs: Diff[] = [];
  let processed = 0;
  let errors = 0;

  for (const story of (stories ?? []) as StoryRow[]) {
    try {
      const newFlags = await rescoreStory(story);
      const oldFlags = Array.isArray(story.cross_tracker_flags) ? story.cross_tracker_flags : [];

      processed++;

      if (!flagsEqual(oldFlags, newFlags)) {
        const oldSet = new Set(oldFlags);
        const newSet = new Set(newFlags);
        const removed = oldFlags.filter(f => !newSet.has(f));
        const added   = newFlags.filter(f => !oldSet.has(f));

        diffs.push({
          id:           story.id,
          title:        story.title.slice(0, 80),
          old_flags:    oldFlags,
          new_flags:    newFlags,
          changed_from: removed.join(', ') || '(none)',
          changed_to:   added.join(', ')   || '(none)',
        });
      }

      if (processed % 25 === 0) {
        console.log(`  [${processed}/${stories!.length}] ${diffs.length} diffs so far...`);
      }

      // Rate limit: 1 req/s for Haiku (conservative)
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      errors++;
      console.error(`  Error on "${story.title.slice(0, 60)}":`, err);
    }
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[backfill-tracker-flags] RESULTS`);
  console.log(`  Processed : ${processed}`);
  console.log(`  Errors    : ${errors}`);
  console.log(`  Diffs     : ${diffs.length} stories would change cross_tracker_flags`);
  console.log(`${'─'.repeat(60)}\n`);

  if (diffs.length > 0) {
    console.log('Sample diffs (first 20):');
    for (const d of diffs.slice(0, 20)) {
      console.log(`  "${d.title}"`);
      console.log(`    OLD: [${d.old_flags.join(', ') || 'empty'}]`);
      console.log(`    NEW: [${d.new_flags.join(', ') || 'empty'}]`);
      console.log(`    -${d.changed_from}  +${d.changed_to}`);
    }

    // Frequency analysis: which slugs are being added/removed most?
    const removedCounts: Record<string, number> = {};
    const addedCounts:   Record<string, number> = {};
    for (const d of diffs) {
      for (const f of d.old_flags.filter(f => !d.new_flags.includes(f))) {
        removedCounts[f] = (removedCounts[f] ?? 0) + 1;
      }
      for (const f of d.new_flags.filter(f => !d.old_flags.includes(f))) {
        addedCounts[f] = (addedCounts[f] ?? 0) + 1;
      }
    }
    console.log('\nRemoved slug frequency:', removedCounts);
    console.log('Added slug frequency  :', addedCounts);
  }

  // ── Plan-mode-required zone gate ─────────────────────────────────────────────
  if (!CONFIRM) {
    console.log('\n[backfill-tracker-flags] DRY RUN COMPLETE — no DB writes made.');
    console.log('[backfill-tracker-flags] Review the diffs above, then re-run with --confirm to apply.\n');
    process.exit(0);
  }

  // ── Apply diffs ───────────────────────────────────────────────────────────────
  if (diffs.length === 0) {
    console.log('[backfill-tracker-flags] No diffs to apply. Done.\n');
    process.exit(0);
  }

  console.log(`\n[backfill-tracker-flags] APPLYING ${diffs.length} diffs to stories.cross_tracker_flags...`);
  let applied = 0;
  let applyErrors = 0;

  for (const d of diffs) {
    const { error: updateError } = await sb
      .from('stories')
      .update({ cross_tracker_flags: d.new_flags })
      .eq('id', d.id);

    if (updateError) {
      applyErrors++;
      console.error(`  Update error for ${d.id}:`, updateError.message);
    } else {
      applied++;
    }
  }

  console.log(`\n[backfill-tracker-flags] Applied: ${applied}, Errors: ${applyErrors}`);
  console.log('[backfill-tracker-flags] Done.\n');
}

main().catch(err => {
  console.error('[backfill-tracker-flags] Fatal:', err);
  process.exit(1);
});
