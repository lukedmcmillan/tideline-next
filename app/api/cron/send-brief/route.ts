import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import {
  compileBriefHtml,
  type BriefData,
  type BriefUser,
  type LeadItem,
  type ConditionRow,
  type WatchEvent,
} from "@/app/lib/brief/template";
import {
  selectLead,
  selectConditions,
  selectEvidence,
  selectWhatToWatch,
  selectAcrossSector,
  computeBandCrossings,
  determineVariant,
  computeWatchlistHits,
  computeSelectionMath,
  type StoryRow,
  type TrackerScoreRow,
  type GovernanceEventRow,
  type CategoryClassification,
} from "@/app/lib/brief/select";
import {
  generateSignOff,
  currentWeekday,
  fmtDate,
  isoWeekNumber,
  TRACKER_TO_TOPICS,
  STATIC_WORK_REVEALED,
  STAKEHOLDER_LABELS,
  type Weekday,
} from "@/app/lib/brief/utils";
import { getStakesSentence } from "@/app/lib/brief/stakes";
import { generateInsightPanel } from "@/app/lib/brief/insights";
import {
  computeConflictState,
  validateHeartbeat,
  countPriorCardAppearances,
  type DivergenceRow,
} from "@/app/lib/brief/conflicts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Category classification (Haiku, called once per cron run, cached by storyId) ──
//
// Implements the category gate from brief-category-gate-redesign.md.
// category is the primary news angle (GOVERNANCE_CHANGE, ANALYSIS_OR_FINDING, etc.).
// governance_significance (0-100) is written to cache for diagnostics ONLY —
// it MUST NOT influence any selection, ranking, gating, or ordering logic.
// See CategoryClassification in select.ts for the enforcement contract.

const CATEGORY_SYSTEM =
  "You classify ocean governance news stories into exactly one category.\n\n" +
  "Categories:\n" +
  "- GOVERNANCE_CHANGE: A state, international body, or treaty took a binding or formal action —\n" +
  "  designation of protected area, ratification, adoption of regulation, enforcement action,\n" +
  "  sanction, ban, approval, entry into force, formal commitment. Actor must be an institutional\n" +
  "  authority (government, IGO, treaty secretariat) — not a company or research team.\n" +
  "  The formal action must be what the story is PRIMARILY REPORTING as news today.\n" +
  "- ANALYSIS_OR_FINDING: Research result, scientific study, data release, expert analysis.\n" +
  "  The news is that findings exist, not that an authority acted.\n" +
  "- COMMERCIAL_BUSINESS: Company product launch, commercial deal, fleet order, funding round,\n" +
  "  vendor announcement. Actor is a private company.\n" +
  "- EXPLAINER_OR_DISCUSSION: Conference proceeding, expert opinion, background explainer,\n" +
  "  policy debate, meeting summary. Nothing was formally decided.\n" +
  "- OTHER: Does not fit above categories.\n\n" +
  "Also return governance_significance (0-100): how important is this to ocean-policy professionals,\n" +
  "regardless of category. Advisory only — not used for gating or ordering.\n\n" +
  "PRIMARY ANGLE RULE: Category is determined by what the story's headline and opening sentence\n" +
  "report as news TODAY — not by governance entities mentioned in background context.\n" +
  "- A science paper discussing a treaty as context → ANALYSIS_OR_FINDING\n" +
  "- Researchers modelling what a treaty COULD enable → ANALYSIS_OR_FINDING or EXPLAINER_OR_DISCUSSION\n" +
  "- A past government action being studied for outcomes → ANALYSIS_OR_FINDING\n" +
  "- A new formal designation, ratification, or decision THIS CYCLE → GOVERNANCE_CHANGE\n" +
  "- A past governance event (treaty entered into force, regulation adopted, law signed — months or\n" +
  "  years ago) cited as historical background for what scientists, experts, or conservationists\n" +
  "  discussed at a conference, summit, or scientific meeting → EXPLAINER_OR_DISCUSSION. The\n" +
  "  governance event is context, not today's news.\n" +
  "Classify GOVERNANCE_CHANGE only when the formal action IS the primary news event reported today,\n" +
  "not when a past formal action is stated as established fact to set context for current analysis,\n" +
  "discussion, or conference proceedings.\n\n" +
  "Return JSON only:\n" +
  "{\"category\": string, \"governance_significance\": integer, \"reasoning\": string (one sentence)}";

// Prompt version: first 16 hex chars of SHA-256(CATEGORY_SYSTEM).
// Automatically invalidates the permanent cache when the prompt changes.
// Old verb-era rows (under DELTA_PROMPT_VERSION) have a different hash — they are
// never returned for CATEGORY_PROMPT_VERSION queries (key mismatch = cache miss).
// Computed once at module load — stable within a process lifetime.
const CATEGORY_PROMPT_VERSION = createHash("sha256")
  .update(CATEGORY_SYSTEM)
  .digest("hex")
  .slice(0, 16);

/**
 * Classifies a pool of stories with the Haiku category classifier.
 *
 * Determinism guarantee: every classification is stored in delta_classifications
 * (keyed by story_id + prompt_version hash). A story is classified ONCE per prompt
 * version — cache hits return the stored result without calling the model.
 * Changing the prompt produces a new CATEGORY_PROMPT_VERSION hash, automatically
 * invalidating all prior cached rows (including verb-era rows) and triggering fresh
 * category classifications.
 *
 * temperature: 0 is mandatory for gate calls. Same input → same output, always.
 * The cache makes re-rolls structurally impossible.
 *
 * governance_significance is written to the cache column for diagnostics only.
 * It MUST NOT be used for gating, ordering, or any selection logic.
 */
async function categoryCandidates(
  candidates: StoryRow[],
): Promise<Map<string, CategoryClassification>> {
  const resultMap = new Map<string, CategoryClassification>();
  if (candidates.length === 0) return resultMap;

  // ── 1. Batch-lookup permanent cache ───────────────────────────────────────
  // Only rows matching CATEGORY_PROMPT_VERSION are returned.
  // Verb-era rows (different prompt_version) are never served — invalidation by key mismatch.
  const ids = candidates.map(s => s.id);
  const { data: cached } = await supabase
    .from("delta_classifications")
    .select("story_id, category, governance_significance")
    .in("story_id", ids)
    .eq("prompt_version", CATEGORY_PROMPT_VERSION)
    .not("category", "is", null);  // paranoia: skip rows without category (verb-era shape)

  const cachedIds = new Set<string>();
  for (const row of cached ?? []) {
    if (!row.category) continue;
    resultMap.set(row.story_id, {
      category:               row.category as CategoryClassification['category'],
      governance_significance: row.governance_significance ?? 0,
    });
    cachedIds.add(row.story_id);
  }

  const uncached = candidates.filter(s => !cachedIds.has(s.id));
  console.log(
    `[send-brief] Category cache (v:${CATEGORY_PROMPT_VERSION}): ` +
    `${cachedIds.size} hits, ${uncached.length} misses of ${candidates.length} stories`
  );

  if (uncached.length === 0) return resultMap;

  // ── 2. Classify uncached stories in parallel ───────────────────────────────
  // temperature: 0 is mandatory for gate calls — structural determinism.
  // cache_control: ephemeral caches the system prompt for repeated calls (cost saving).
  const newResults = await Promise.all(
    uncached.map(async (s): Promise<readonly [string, CategoryClassification]> => {
      const fallback: CategoryClassification = { category: 'OTHER', governance_significance: 0 };
      try {
        const res = await anthropic.messages.create({
          model:       "claude-haiku-4-5-20251001",
          max_tokens:  300,
          temperature: 0,  // gate calls must be deterministic
          system: [{ type: "text", text: CATEGORY_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [{
            role:    "user",
            content: `Title: ${s.title}\nSummary: ${s.short_summary ?? s.description ?? ""}`,
          }],
        });
        const raw     = res.content[0].type === "text" ? res.content[0].text.trim() : "";
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const match   = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return [s.id, fallback] as const;
        const parsed = JSON.parse(match[0]);
        const validCategories = new Set(['GOVERNANCE_CHANGE','ANALYSIS_OR_FINDING','COMMERCIAL_BUSINESS','EXPLAINER_OR_DISCUSSION','OTHER']);
        const category = validCategories.has(parsed.category) ? parsed.category : 'OTHER';
        const governance_significance = typeof parsed.governance_significance === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.governance_significance)))
          : 0;
        return [s.id, { category, governance_significance }] as const;
      } catch {
        return [s.id, fallback] as const;
      }
    })
  );

  // ── 3. Persist new classifications to permanent cache ─────────────────────
  // Writes category + governance_significance to the new columns.
  // Old columns (is_delta, actor, delta_verb, object) are NOT written — they stay null
  // for new rows. Old verb-era rows are untouched.
  const toInsert = newResults.map(([story_id, cls]) => ({
    story_id,
    prompt_version:          CATEGORY_PROMPT_VERSION,
    is_delta:                false,   // satisfies NOT NULL constraint; semantically meaningless here
    category:                cls.category,
    governance_significance: cls.governance_significance,
  }));

  const { error: insertError } = await supabase
    .from("delta_classifications")
    .upsert(toInsert, { onConflict: "story_id,prompt_version" });

  if (insertError) {
    // Non-fatal: classification still works — just won't persist for warm-run savings
    console.warn("[send-brief] Category cache insert failed (non-fatal):", insertError.message);
  }

  // ── 4. Add new results to map ─────────────────────────────────────────────
  for (const [id, cls] of newResults) {
    resultMap.set(id, cls);
  }

  return resultMap;
}

// ── Pool shape from brief_buffer.stories JSONB (Phase 4a format) ───────────────
interface BriefPool {
  candidate_stories:   StoryRow[];
  all_tracker_scores:  TrackerScoreRow[];
  all_events:          GovernanceEventRow[];
  work_revealed_count: { sources: number; candidate_count: number; filtered_count: number };
  generated_at:        string;
}

// ── Subject-line generation ────────────────────────────────────────────────────
// Format: [headline] · [data point]
// Data point priority: ELEVATED pulse score > nearest event > nothing
// Double-Pulse guard: if headline already contains "Pulse X.X" (hybrid mode),
// append event day label instead to avoid "Pulse 5.9. ... · Pulse 5.6" repeats.
function buildSubject(
  lead: LeadItem,
  conditions: ConditionRow[],
  events: WatchEvent[],
): string {
  // In Mode b (state type with hybrid framing), headline is a long compound sentence.
  // Use subjectHeadline (the bare story title) instead for the email subject.
  const rawHeadline = (lead.type === 'state' && lead.subjectHeadline
    ? lead.subjectHeadline
    : lead.headline
  ).replace(/\.$/, "").trim();

  // Determine suffix first so the headline cap can account for it.
  // Total subject = headline + suffix must fit within 80 chars.
  const headlineHasPulse = /Pulse \d+\.?\d*/i.test(rawHeadline);
  let suffix = "";
  if (headlineHasPulse) {
    suffix = events.length > 0 ? ` · ${events[0].dayLabel}` : "";
  } else {
    const elevated = conditions.find(c => c.band === "ELEVATED");
    if (elevated) suffix = ` · Pulse ${elevated.score.toFixed(1)}`;
    else if (events.length > 0) suffix = ` · ${events[0].dayLabel}`;
  }

  // Cap headline so that headline + suffix ≤ 80 chars. Government press-release
  // titles (Mode a / LOW-band fallback) can be 100+ chars without this guard.
  const maxHeadline = 80 - suffix.length;
  const headline = rawHeadline.length > maxHeadline
    ? rawHeadline.slice(0, maxHeadline).replace(/\s\S+$/, "").trim()
    : rawHeadline;

  return `${headline}${suffix}`;
}

// ── Resend send ───────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <luke@thetideline.co>",
        reply_to: "brief-replies@thetideline.co",
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now       = new Date();
    const todayDate = now.toISOString().split("T")[0];
    const weekday   = currentWeekday(); // null if weekend

    // ── Weekend skip (belt-and-braces — vercel.json already uses 1-5 schedule) ──
    if (!weekday) {
      return NextResponse.json({ skipped: true, reason: "weekend", count: 0 });
    }

    const dateStr   = fmtDate(now);
    const weekNum   = isoWeekNumber(now);
    const nowIso    = now.toISOString();

    // ── 1. Load today's brief pool ────────────────────────────────────────────
    const { data: briefBuffer } = await supabase
      .from("brief_buffer")
      .select("stories, story_count")
      .eq("date", todayDate)
      .single();

    if (!briefBuffer) {
      console.log("[send-brief] No brief_buffer row for today — generate-brief may not have run.");
      return NextResponse.json({ skipped: true, reason: "no_brief_today", count: 0 });
    }

    const rawPool = briefBuffer.stories;

    // Legacy format check: old rows stored an array of story objects
    if (Array.isArray(rawPool) || !rawPool?.candidate_stories) {
      console.log("[send-brief] brief_buffer row is in legacy format, skipping. Today's generate-brief may not have run yet.");
      return NextResponse.json({ skipped: true, reason: "legacy_format", count: 0 });
    }

    const pool = rawPool as BriefPool;
    console.log(
      `[send-brief] Pool loaded: ${pool.candidate_stories.length} stories, ` +
      `${pool.all_tracker_scores.length} trackers, ${pool.all_events.length} events`
    );

    // ── 1b. Pre-compute category classifications (once, shared across all subscribers) ──
    // categoryCandidates calls Haiku once per story in the pool (parallel, cached by story_id+prompt_version).
    // The map is passed to selectLead for each subscriber — no per-subscriber Haiku calls.
    const categoryMap = await categoryCandidates(pool.candidate_stories);
    const govChangeEligible = [...categoryMap.values()].filter(c => c.category === 'GOVERNANCE_CHANGE').length;
    console.log(
      `[send-brief] Category classification: ${govChangeEligible}/${pool.candidate_stories.length} GOVERNANCE_CHANGE`
    );

    // ── 1c. Band crossings (in-memory, uses sparklineHistory timestamps) ──────
    // velocity cron is ~4-day cadence, not weekly — sparklineHistory required for accuracy.
    const bandCrossings = computeBandCrossings(pool.all_tracker_scores);
    if (bandCrossings.size > 0) {
      console.log(`[send-brief] Band crossings this week: ${[...bandCrossings].join(", ")}`);
    }

    // ── 2. Determine recipients ───────────────────────────────────────────────
    const testEmail = process.env.TEST_EMAIL;
    const isTestMode = !!testEmail;

    type Subscriber = {
      id: string;
      email: string;
      unsubscribe_token: string | null;
      topics: string[];
      created_at: string | null;
      stakeholder_type: string | null;
    };

    let subscribers: Subscriber[];

    if (isTestMode) {
      // In test mode, look up the actual user by email so topics/token are real
      const { data: testUser } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token, topics, created_at, stakeholder_type")
        .eq("email", testEmail)
        .single();

      subscribers = [{
        id:                testUser?.id ?? "test",
        email:             testEmail,
        unsubscribe_token: testUser?.unsubscribe_token ?? null,
        topics:            Array.isArray(testUser?.topics) ? testUser.topics : [],
        created_at:        testUser?.created_at ?? null,
        stakeholder_type:  testUser?.stakeholder_type ?? null,
      }];
      console.log(`[send-brief] TEST MODE → ${testEmail}, topics: ${subscribers[0].topics.join(",")}`);
    } else {
      const { data: users, error: subError } = await supabase
        .from("users")
        .select("id, email, unsubscribe_token, topics, created_at, stakeholder_type")
        .in("subscription_status", ["active", "trial", "trialing"])
        .not("onboarded_at", "is", null);

      if (subError || !users || users.length === 0) {
        return NextResponse.json({
          sent: 0,
          source: "today",
          error: subError?.message || "No subscribers found",
        });
      }
      subscribers = users.map(u => ({
        ...u,
        topics: Array.isArray(u.topics) ? u.topics : [],
        stakeholder_type: u.stakeholder_type ?? null,
      }));
    }

    // ── 2b. Pre-subscriber shared queries ─────────────────────────────────────
    // Active divergences (shared across all subscribers, filtered per-user by tracker_tag)
    const { data: activeDivergences } = await supabase
      .from("divergences")
      .select("id, tracker_tag, headline, score, is_active, detected_at, resolved_outcome, resolved_at, source_a_name, source_a_claim, source_b_name, source_b_claim, why_it_matters")
      .eq("is_active", true);
    const allDivergences: DivergenceRow[] = (activeDivergences ?? []) as DivergenceRow[];

    // Upcoming governance sessions for RESOLUTION_APPROACHING (next 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const { data: upcomingSessionsData } = await supabase
      .from("governance_sessions")
      .select("tracker_tag, start_date")
      .gte("start_date", todayDate)
      .lte("start_date", sevenDaysFromNow);
    const upcomingSessions = (upcomingSessionsData ?? []).map(s => ({
      tracker_tag: s.tracker_tag as string,
      start_date: s.start_date as string,
    }));

    // Source count for selection math
    const { count: totalSourceCount } = await supabase
      .from("scraped_sources")
      .select("id", { count: "exact", head: true });

    // ── 3. Per-subscriber loop ────────────────────────────────────────────────
    let sent    = 0;
    const errors: string[] = [];
    const sendType = isTestMode ? "test_send" : "production";
    let checkpoint1Response: Record<string, unknown> | null = null;

    for (const sub of subscribers) {
      if (!sub.email) continue;
      const userTopics: string[] = sub.topics;
      const stakeholderType = sub.stakeholder_type ?? "esg_finance";

      // ── 3a. Async context ──
      // Previous brief_sends for recently-led exclusion + conflict state tracking
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let recentlyLedIds = new Set<string>();
      let lastDivergenceSnapshot: Record<string, number> = {};
      let lastConflictCardIds: string[] = [];
      let priorBriefSends: { conflict_card_ids: string[] | null }[] = [];

      if (sub.id !== "test") {
        const { data: recentSends } = await supabase
          .from("brief_sends")
          .select("lead_story_id, divergence_snapshot, conflict_card_ids")
          .eq("user_id", sub.id)
          .gte("sent_at", sevenDaysAgo)
          .order("sent_at", { ascending: false });

        recentlyLedIds = new Set(
          (recentSends ?? []).map(r => r.lead_story_id as string).filter(Boolean)
        );

        // Last send's divergence snapshot for ESCALATED/DE_ESCALATED detection
        const lastSend = recentSends?.[0];
        if (lastSend?.divergence_snapshot && typeof lastSend.divergence_snapshot === "object") {
          lastDivergenceSnapshot = lastSend.divergence_snapshot as Record<string, number>;
        }
        lastConflictCardIds = (lastSend?.conflict_card_ids as string[]) ?? [];

        // All prior sends for 3-appearance cap counting
        priorBriefSends = (recentSends ?? []).map(s => ({
          conflict_card_ids: (s.conflict_card_ids as string[]) ?? null,
        }));
      }

      // User's tracked entities for watchlist hit-line
      const { data: userEntityRows } = await supabase
        .from("user_entities")
        .select("entity_id")
        .eq("user_id", sub.id);
      const userEntityIds = new Set<string>(
        (userEntityRows ?? []).map(r => r.entity_id as string)
      );

      // ── 3b. Sync selectors ──
      const leadResult   = selectLead(pool.candidate_stories, pool.all_tracker_scores, userTopics, recentlyLedIds, categoryMap, bandCrossings);
      const lead         = leadResult.lead;
      const { gate: leadGate, leadStory, categoryClassification, diagnostics: leadDiag } = leadResult;

      if (leadGate === 'fallback') {
        console.warn(
          `[send-brief] *** THE SIGNAL (fallback) for ${sub.email} *** ` +
          `${leadDiag.totalCandidates} candidates, ${leadDiag.govChangeCount} GOVERNANCE_CHANGE at sig>=${35}. ` +
          `No qualifying governance story — routing to best-signal fallback.`
        );
      }

      // Checkpoint 1 (test mode only)
      if (isTestMode) {
        const d = leadDiag;
        const oldCls = d.oldTopStory ? categoryMap.get(d.oldTopStory.id) : undefined;
        let oldVsNew: string;
        if (d.oldTopStory && leadStory && d.oldTopStory.id !== leadStory.id) {
          oldVsNew = `DIVERGED — old choice ${oldCls?.category !== 'GOVERNANCE_CHANGE' ? `failed category gate (${oldCls?.category ?? 'unclassified'})` : "lost on Gate ranking"}`;
        } else if (d.oldTopStory && leadStory && d.oldTopStory.id === leadStory.id) {
          oldVsNew = "SAME story selected by both";
        } else if (!d.oldTopStory && leadStory) {
          oldVsNew = "Old had no sig>=35 story; new category gate found a GOVERNANCE_CHANGE candidate";
        } else {
          oldVsNew = "Both lead with state/fallback";
        }
        checkpoint1Response = {
          test_email_resolved: testEmail,
          pool_total: d.totalCandidates,
          gov_change_eligible: d.govChangeCount,
          gate_fired: leadGate.toUpperCase(),
          fallback_fired: leadGate === "fallback",
          old_logic_lead: d.oldTopStory ? { id: d.oldTopStory.id, sig: d.oldTopStory.significance_score, title: d.oldTopStory.title.slice(0, 100) } : null,
          new_logic_lead: leadStory ? { id: leadStory.id, sig: leadStory.significance_score, title: leadStory.title.slice(0, 100), gate: leadGate } : { state_lead: lead.headline },
          old_vs_new: oldVsNew,
        };
      }

      const conditions   = selectConditions(pool.all_tracker_scores, userTopics);
      const evidence     = selectEvidence(pool.candidate_stories, lead, userTopics);
      const whatToWatch  = selectWhatToWatch(pool.all_events, userTopics, 14);
      const acrossSector = selectAcrossSector(pool.candidate_stories, userTopics);
      const signOff      = generateSignOff(weekday);

      // ── 3c. Conflict lifecycle ──
      const userTrackerTags = new Set<string>(userTopics);
      const userDivergences = allDivergences.filter(d => userTrackerTags.has(d.tracker_tag));
      const conflictResults = userDivergences.map(div => {
        const priorCount = countPriorCardAppearances(div.id, priorBriefSends);
        return computeConflictState(div, lastDivergenceSnapshot, lastConflictCardIds, priorCount, upcomingSessions);
      });
      const conflictStateChanged = conflictResults.some(r => r.shouldRenderFullCard);
      const heartbeatLines = conflictResults
        .map(r => validateHeartbeat(r.heartbeatLine, userDivergences.find(d => d.id === r.divergenceId)!))
        .filter(Boolean) as string[];
      const conflictHeartbeat = heartbeatLines.length > 0 ? heartbeatLines[0] : null;
      const activeDivergenceIds = userDivergences.map(d => d.id);
      const cardDivergenceIds = conflictResults.filter(r => r.shouldRenderFullCard).map(r => r.divergenceId);

      // ── 3d. Variant determination ──
      const variant = determineVariant(leadGate, bandCrossings, userTopics, conflictStateChanged);

      // ── 3e. Watchlist hit-line ──
      const briefStoryIds = [lead.storyId, ...evidence.map(e => e.storyId)].filter(Boolean) as string[];
      let watchlistHitLine: string | null = null;
      if (userEntityIds.size > 0 && briefStoryIds.length > 0) {
        const { data: mentionRows } = await supabase
          .from("entity_mentions")
          .select("story_id, entity_id, entities(name)")
          .in("story_id", briefStoryIds)
          .in("entity_id", Array.from(userEntityIds));
        const mentions = (mentionRows ?? []).map((r: any) => ({
          story_id: r.story_id as string,
          entity_id: r.entity_id as string,
          entity_name: r.entities?.name as string ?? "",
        }));
        const hits = computeWatchlistHits(briefStoryIds, userEntityIds, mentions);
        if (hits) {
          watchlistHitLine = `Today's brief touches ${hits.count} entit${hits.count === 1 ? "y" : "ies"} you track: ${hits.names.join(", ")}.`;
        }
      }

      // ── 3f. Stakes sentence (cached per stakeholder_type per day) ──
      const stakesSentence = leadStory
        ? await getStakesSentence(stakeholderType, todayDate, leadStory.title, leadStory.short_summary ?? leadStory.description ?? "", anthropic)
        : null;
      // Append stakes to lead interpretation if available
      if (stakesSentence) {
        const stakeholderLabel = STAKEHOLDER_LABELS[stakeholderType] ?? "For your screening:";
        lead.interpretation = `${lead.interpretation} ${stakeholderLabel} ${stakesSentence}`;
      }

      // ── 3g. Insight panels for evidence items ──
      const evidenceWithPanels = await Promise.all(
        evidence.map(async (item) => {
          if (!item.storyId) return item;
          const story = pool.candidate_stories.find(s => s.id === item.storyId);
          if (!story) return item;
          const panel = await generateInsightPanel(
            item.storyId, story.title, story.short_summary ?? story.description ?? "", stakeholderType, anthropic
          );
          return { ...item, insightPanel: panel };
        })
      );

      // ── 3h. Selection math ──
      const userStories = pool.candidate_stories.filter(s =>
        s.topic === 'all' || userTopics.length === 0 ||
        userTopics.some(t => (TRACKER_TO_TOPICS[t] || [t]).includes(s.topic))
      );
      const selectionMath = computeSelectionMath(
        totalSourceCount ?? 89,
        pool.candidate_stories.length,
        userStories.filter(s => !!s.short_summary).length,
      );

      // ── 3i. Build BriefData ──
      const preheader = lead.interpretation.slice(0, 90).replace(/\n/g, " ").trim();

      const briefData: BriefData = {
        dateStr,
        preheader,
        variant,
        lead,
        watchlistHitLine,
        conditions,
        evidence: evidenceWithPanels,
        whatToWatch,
        acrossSector,
        conflictHeartbeat,
        selectionMath,
        stakeholderType,
        workRevealedLine: STATIC_WORK_REVEALED,
        signOff,
      };

      const briefUser: BriefUser = {
        email:            sub.email,
        unsubscribeToken: sub.unsubscribe_token,
      };

      // ── 3j. Render HTML ──
      const html = compileBriefHtml(briefData, briefUser);

      // ── 3k. Generate subject ──
      const subject = buildSubject(lead, conditions, whatToWatch);

      // ── 3l. Log selection context ──
      console.log(
        `[send-brief] ${sub.email} → variant:${variant} lead: [${lead.type}] "${lead.headline.slice(0, 60)}" | ` +
        `conditions: ${conditions.length} | evidence: ${evidenceWithPanels.length} | ` +
        `conflicts: ${userDivergences.length} (${cardDivergenceIds.length} cards) | ` +
        `subject: "${subject.slice(0, 70)}"`
      );

      // ── 3m. Send ──
      const ok = await sendEmail(sub.email, subject, html);

      if (ok) {
        sent++;

        if (!isTestMode) {
          supabase.from("users").update({ last_brief_sent: nowIso }).eq("id", sub.id).then(() => {});
        }

        const topTrackerSlug = pool.all_tracker_scores
          .filter(t => userTopics.length === 0 || userTopics.includes(t.tracker_slug))
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.tracker_slug ?? null;

        // Build divergence snapshot: {divergence_id: score} for ESCALATED/DE_ESCALATED detection
        const divergenceSnapshot: Record<string, number> = {};
        for (const div of userDivergences) {
          divergenceSnapshot[div.id] = div.score;
        }

        supabase
          .from("brief_sends")
          .insert({
            user_id:              sub.id === "test" ? null : sub.id,
            email:                sub.email,
            story_count:          evidenceWithPanels.length,
            tracker_slug:         topTrackerSlug,
            send_type:            sendType,
            brief_date:           todayDate,
            lead_story_id:        lead.storyId ?? null,
            delta_fallback:       leadGate === "fallback",
            variant,
            story_ids:            briefStoryIds.length > 0 ? briefStoryIds : null,
            synthesis_line:       lead.interpretation ?? null,
            divergence_ids:       activeDivergenceIds.length > 0 ? activeDivergenceIds : null,
            divergence_snapshot:  Object.keys(divergenceSnapshot).length > 0 ? divergenceSnapshot : null,
            conflict_card_ids:    cardDivergenceIds.length > 0 ? cardDivergenceIds : null,
          })
          .then(() => {});
      } else {
        errors.push(sub.email);
        console.error(`[send-brief] Send failed for ${sub.email}`);
      }
    }

    return NextResponse.json({
      sent,
      total:      subscribers.length,
      source:     "today",
      test_mode:  isTestMode,
      errors:     errors.length > 0 ? errors : undefined,
      checkpoint1: checkpoint1Response ?? undefined,
    });
  } catch (err) {
    console.error("send-brief error:", err);
    return NextResponse.json(
      { error: "Failed to send brief", details: String(err) },
      { status: 500 }
    );
  }
}
