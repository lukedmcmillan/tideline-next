import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, title, short_summary')
      .gte('published_at', h24)
      .eq('significance_score', 0)
      .not('short_summary', 'is', null)
      .limit(50)

    if (error) {
      console.error('[Significance] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!stories || stories.length === 0) {
      console.log('[Significance] No unscored stories found')
      return NextResponse.json({ scored: 0, message: 'No unscored stories' })
    }

    console.log(`[Significance] Scoring ${stories.length} stories`)

    let scored = 0
    let featured = 0

    for (const story of stories) {
      try {
        // Source of truth for tracker definitions and failure modes:
        // PULSE_SCORE_METHODOLOGY.md §4 (Domain Thresholds) and §6 (Failure Modes).
        // If the methodology changes, this prompt MUST change with it — they must stay in lockstep.
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: [{
            type: 'text',
            // cache_control kept for forward-proofing; activates at 2048+ tokens for Haiku 4.5
            cache_control: { type: 'ephemeral' },
            text: `You are an ocean governance significance scorer for Tideline. Score stories and assign tracker slugs. Return JSON only. No markdown. No explanation.

TRACKER SLUG DEFINITIONS
Verbatim from PULSE_SCORE_METHODOLOGY.md §4 Domain Thresholds. Prompt and methodology must stay in lockstep.

bbnj — BBNJ High Seas Treaty. Multilateral/complex. Covers the UN Agreement on Marine Biodiversity of Areas Beyond National Jurisdiction: ratification, implementation, signatory actions, ICP meetings, draft text negotiations, entry-into-force milestones. Calibrated threshold: 6.0. True positive rate: ~60%. Failure mode: Implementation phase signals are diffuse across 168 signatories.

isa — ISA Deep-Sea Mining. Multilateral/veto players. Covers the International Seabed Authority: council sessions, exploitation regulations, contractor licences, nodule/crust/sulphide extraction permits, mining code text, ISA Assembly decisions, and sponsoring state actions. Calibrated threshold: 6.5. True positive rate: ~65%. Failure mode: Commercial licensing runs structurally low due to confidential contractor communications. Do NOT assign isa solely because a story mentions "ocean floor" or "seabed" without an ISA regulatory link.

iuu — IUU Fishing Enforcement. Plurilateral. Covers illegal, unreported and unregulated fishing: port state control actions, flag state certifications, IUU vessel lists, carding decisions (EU, US, UK), RFMO enforcement, and high-seas boarding inspections. Calibrated threshold: 5.5. True positive rate: ~70%.

30x30 — 30x30 / MPA Designations. Varies by jurisdiction. Covers marine protected area designations, High Ambition Coalition commitments, national ocean targets aligned with the Kunming-Montreal GBF 30x30 goal, and CCAMLR MPA proposals. Calibrated threshold: 5.0. True positive rate: ~55-75%. Failure mode: Unilateral designations (US, UK) score well; multilateral MPA negotiations (CCAMLR) score poorly due to consensus veto dynamics.

blue_finance — Blue Finance / TNFD. Unilateral/framework body. Covers TNFD framework adoption, blue bonds, debt-for-nature swaps with an ocean component, ocean-linked sustainable finance instruments, and institutional investor ocean commitments. Calibrated threshold: 5.5. True positive rate: ~75%. Failure mode: Private transaction signals invisible — score runs structurally lower. Do NOT assign blue_finance to fisheries infrastructure grants, port construction, or domestic maritime spending — those are not blue finance instruments. Required test: is there a named financial instrument (bond, swap, fund) or named framework adoption (TNFD, IPSF, GBF finance target)?

imo_shipping — IMO Shipping Emissions. Plurilateral. Covers IMO MEPC sessions, GHG strategy revision, CII ratings, carbon intensity indicators, EEDI/EEXI regulations, alternative fuels framework, and flag state ratification of IMO instruments. Calibrated threshold: 6.0. True positive rate: ~70%. Failure mode: Flag state ratification divergence creates noise.

wto_fisheries — WTO Fisheries Subsidies. Multilateral/consensus. Covers the WTO Agreement on Fisheries Subsidies: implementation, ratification, Fish Two negotiations (harmful subsidies phase 2), capacity and overfishing provisions, dispute settlement. Agreement entered into force September 2025; Fish Two negotiations stalled. Calibrated threshold: 6.5. True positive rate: ~50%.

cites_marine — CITES Marine Species. Multilateral/CoP cycle. Covers CITES CoP decisions on shark species, rays, seahorses, queen conch, and other marine wildlife: listing proposals, implementation by range states, trade permit enforcement, intersessional working group outputs. Calibrated threshold: 6.5. True positive rate: ~65%. Failure mode: Signal concentrates around CoP dates, quiet between.

plastics — Plastics Treaty (INC). Multilateral/contested. Covers INC sessions of the UN treaty to end plastic pollution: draft text, national positions, veto coalition dynamics, extended producer responsibility provisions, and waste trade chapters. Calibrated threshold: 5.5. True positive rate: ~55%. Failure mode: Veto coalition dynamics poorly captured.

offshore_wind — Offshore Wind. Unilateral/national. Covers national offshore wind licensing, planning approvals, auction results, grid connection decisions, and port infrastructure for turbine installation. Calibrated threshold: 4.5. True positive rate: ~80%.

blue_carbon_credits — Blue Carbon & Biodiversity Credits. Type 6 / Voluntary standard-setting. Covers biodiversity credits, blue carbon credits, marine MRV (measurement, reporting, verification), and credit registries: Verra marine protocols, Plan Vivo Blue, Gold Standard marine, ICVCM Core Carbon Principles marine applications, mangrove/seagrass/salt marsh credits, ocean carbon removal credits (mCDR), and credit registry decisions or actions. Calibrated threshold: 7.0. True positive rate: ~70% policy-side (provisional — less than 6 months of data). Failure mode: Standards-body methodology releases generate signal that does not always translate to market uptake. Confidential offtake agreements between credit issuers and corporate buyers are structurally invisible. Do NOT assign blue_carbon_credits to blue bond issuance, debt-for-nature swaps, or TNFD framework adoption (those are blue_finance). Required test: is there a named credit instrument, registry action, MRV protocol, or market transaction specifically in the blue carbon or marine biodiversity credit domain?

STRUCTURAL FAILURE MODES (verbatim from §6)
These constrain tracker assignment — do not over-assign based on surface relevance:

Failure Mode 1 — Consensus-blocked institutions: CCAMLR, ICCAT, and CBD COP generate high document volume regardless of outcome. High volume alone does not justify 30x30 assignment if there is no designation decision.

Failure Mode 3 — Confidential commercial transactions: ISA contractor activity, blue bond issuance, and debt-for-nature negotiations are structurally designed to avoid public signal until completion. Stories about closed commercial processes should not inflate isa or blue_finance assignment beyond what is document-visible.

ASSIGNMENT RULES
- Only assign a slug when the story directly and substantively affects that governance domain.
- When uncertain, assign zero trackers and score conservatively.`,
          }],
          messages: [{
            role: 'user',
            content: `Story headline: ${story.title}
Summary: ${story.short_summary}

Return this exact JSON: { "score": 0-100, "trackers": [] }
Valid tracker slugs: bbnj, isa, iuu, 30x30, blue_finance, imo_shipping, wto_fisheries, cites_marine, plastics, offshore_wind, blue_carbon_credits
Score: 0-30 = routine update, 31-60 = noteworthy, 61-75 = significant development, 76-100 = major policy shift
Only include slugs this story directly affects. Return only valid JSON.`,
          }],
        })

        const text = message.content[0].type === 'text' ? message.content[0].text : ''
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

        const score = Math.max(0, Math.min(100, Math.round(parsed.score || 0)))
        const trackers = Array.isArray(parsed.trackers) ? parsed.trackers.filter((t: string) =>
          // Slug whitelist — must match PULSE_SCORE_METHODOLOGY.md §4 tracker domains exactly.
          // Uses underscore form for cross_tracker_flags column (velocity_scores uses hyphen form).
          ['bbnj', 'isa', 'iuu', '30x30', 'blue_finance', 'imo_shipping', 'wto_fisheries', 'cites_marine', 'plastics', 'offshore_wind', 'blue_carbon_credits'].includes(t)
        ) : []
        const isFeatured = score > 75

        const { error: updateError } = await supabase
          .from('stories')
          .update({
            significance_score: score,
            cross_tracker_flags: trackers,
            is_featured: isFeatured,
          })
          .eq('id', story.id)

        if (updateError) {
          console.error(`[Significance] Update error for ${story.id}:`, updateError)
          continue
        }

        scored++
        if (isFeatured) featured++
        console.log(`[Significance] "${story.title}" → score: ${score}, trackers: [${trackers.join(', ')}]${isFeatured ? ' ★ FEATURED' : ''}`)
      } catch (err) {
        console.error(`[Significance] Error scoring "${story.title}":`, err)
        continue
      }
    }

    console.log(`[Significance] Done. Scored: ${scored}/${stories.length}, Featured: ${featured}`)

    return NextResponse.json({
      scored,
      featured,
      total: stories.length,
    })
  } catch (err) {
    console.error('[Significance] Cron error:', err)
    return NextResponse.json({ error: 'Failed to score stories' }, { status: 500 })
  }
}
