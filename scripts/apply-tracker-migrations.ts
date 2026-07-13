import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function run(label: string, fn: () => Promise<void>) {
  console.log(`\n=== ${label} ===`);
  try {
    await fn();
    console.log("  OK");
  } catch (e: any) {
    console.error("  FAIL:", e.message);
  }
}

async function main() {
  // P-A: trackers table is already created via supabase CLI above.
  // Backfill the 11 rows via supabase-js
  await run("P-A: Backfill trackers", async () => {
    const rows = [
      { slug: "isa", display_name: "Deep-Sea Mining", tier: "active", institutional_type: "Type 2: Mixed architecture", failure_mode_copy: "Cannot detect surprise unilateral actions. Nauru's June 2021 two-year rule trigger occurred at a score of 2.05." },
      { slug: "bbnj", display_name: "High Seas Treaty", tier: "active", institutional_type: "Type 3: Consensus-dependent", failure_mode_copy: "Structural veto players present. Score cannot distinguish breakthrough from deadlock." },
      { slug: "plastics", display_name: "Plastics Treaty", tier: "active", institutional_type: "Type 3: Consensus-dependent", failure_mode_copy: "Petrostate veto dynamics. Score cannot distinguish breakthrough from deadlock." },
      { slug: "imo-shipping", display_name: "IMO Shipping", tier: "active", institutional_type: "Type 2: Mixed architecture", failure_mode_copy: "Session-driven ramp. Inter-session developments may not register until pre-session document publication." },
      { slug: "30x30", display_name: "30x30 MPA", tier: "active", institutional_type: "Type 1: Unilateral decisions", failure_mode_copy: "Sovereign designation decisions have no reliable lead time estimate." },
      { slug: "iuu", display_name: "IUU Fishing", tier: "active", institutional_type: "Type 1/2: Enforcement actions", failure_mode_copy: "Enforcement actions can emerge without prior signal elevation." },
      { slug: "blue-finance", display_name: "Blue Finance", tier: "active", institutional_type: "Type 6: Voluntary standard-setting", failure_mode_copy: "Framework releases follow voluntary timelines with limited structural predictability." },
      { slug: "offshore-wind", display_name: "Offshore Wind", tier: "active", institutional_type: "Type 1: Commercial leasing", failure_mode_copy: "Commercial planning cycles are long. Score reflects regulatory activity, not market timing." },
      { slug: "cites-marine", display_name: "CITES Marine", tier: "active", institutional_type: "Type 2: Majority vote", failure_mode_copy: "CoP cycle means inter-session activity is sparse. Score is reliable only in pre-CoP windows." },
      { slug: "wto-fisheries", display_name: "WTO Fisheries Subsidies", tier: "active", institutional_type: "Type 2: Mixed architecture", failure_mode_copy: "Consensus rule means any member can block. Elevated score may not lead to an outcome." },
      { slug: "blue-carbon-credits", display_name: "Blue Carbon & Biodiversity Credits", tier: "calibrating", institutional_type: "Type 6: Voluntary standard-setting", failure_mode_copy: "Emerging domain with limited historical validation data. Calibrated thresholds are provisional." },
    ];
    const { error } = await sb.from("trackers").upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
    if (error) throw error;
    const { count } = await sb.from("trackers").select("slug", { count: "exact", head: true });
    console.log(`  Rows: ${count}`);
  });

  // P-B: domain_events - need to create table first via SQL, then seed
  // Table creation was done by the supabase CLI call. Seed data:
  await run("P-B: Seed domain_events", async () => {
    const events = [
      { tracker_slug: "isa", name: "ISA Legal and Technical Commission", description: "31st Session, Part I. LTC reviews contractor compliance and environmental assessments.", event_date: "2026-06-29", kind: "decision_point", source_url: "https://isa.org.jm/sessions/31st-session-2026/" },
      { tracker_slug: "isa", name: "ISA Finance Committee", description: "31st Session finance review.", event_date: "2026-07-07", kind: "decision_point", source_url: "https://isa.org.jm/sessions/31st-session-2026/" },
      { tracker_slug: "isa", name: "ISA Council", description: "31st Session, Part II. Mining code negotiations continue.", event_date: "2026-07-13", kind: "decision_point", source_url: "https://isa.org.jm/sessions/31st-session-2026/" },
      { tracker_slug: "isa", name: "ISA Assembly", description: "31st Session. Assembly adopts Council recommendations.", event_date: "2026-07-27", kind: "decision_point", source_url: "https://isa.org.jm/sessions/31st-session-2026/" },
      { tracker_slug: "imo-shipping", name: "MEPC 84", description: "Marine Environment Protection Committee, 84th session. Net-zero framework, CII review, mid-term GHG measures.", event_date: "2026-04-27", kind: "decision_point", source_url: "https://www.imo.org/en/mediacentre/meetingsummaries/pages/preview-mepc-84.aspx" },
      { tracker_slug: "imo-shipping", name: "FuelEU Maritime first reporting year", description: "EU Regulation 2023/1805. First full compliance year GHG intensity monitoring.", event_date: "2025-01-01", kind: "fixed_obligation", source_url: "https://transport.ec.europa.eu/transport-modes/maritime/decarbonising-maritime-transport-fueleu-maritime_en" },
      { tracker_slug: "imo-shipping", name: "EU ETS maritime full scope", description: "CH4 and N2O emissions fall under EU ETS scope from 1 January 2026, in addition to CO2.", event_date: "2026-01-01", kind: "fixed_obligation", source_url: "https://climate.ec.europa.eu/eu-action/transport-decarbonisation/reducing-emissions-shipping-sector_en" },
      { tracker_slug: "imo-shipping", name: "UK ETS maritime inclusion", description: "UK Emissions Trading Scheme extends to maritime transport.", event_date: "2026-07-01", kind: "fixed_obligation", source_url: "https://www.skuld.com/topics/environment/air-pollution/europe/uk-emission-trading-scheme-for-maritime-entering-into-force-on-1-july-2026/" },
      { tracker_slug: "bbnj", name: "BBNJ Agreement entry into force", description: "Agreement entered into force on 17 January 2026.", event_date: "2026-01-17", kind: "fixed_obligation", source_url: "https://treaties.un.org/pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXI-10&chapter=21" },
      { tracker_slug: "bbnj", name: "BBNJ COP1", description: "First Conference of the Parties. Pending formal UN General Assembly approval.", event_date: "2027-01-11", kind: "decision_point", source_url: "https://highseasalliance.org/" },
      { tracker_slug: "cites-marine", name: "CITES Standing Committee (SC28)", description: "28th meeting of the Standing Committee.", event_date: "2026-07-17", kind: "decision_point", source_url: "https://cites.org/eng/news/calendar.php" },
      { tracker_slug: "cites-marine", name: "CITES Standing Committee (SC81)", description: "81st meeting. Implementation review and compliance matters.", event_date: "2026-11-02", kind: "decision_point", source_url: "https://cites.org/eng/sc/81" },
      { tracker_slug: "plastics", name: "INC-5.3 concluded", description: "Third part of the fifth session concluded in Geneva, February 2026. New chair elected. Next session dates TBD.", event_date: "2026-02-07", kind: "decision_point", source_url: "https://www.ciel.org/news/inc-5-3-reaction/" },
      { tracker_slug: "wto-fisheries", name: "WTO Rules Negotiating Group", description: "Post-MC14 negotiations on second wave disciplines (overcapacity and overfishing subsidies).", event_date: "2026-07-08", kind: "decision_point", source_url: "https://www.wto.org/english/news_e/news26_e/fish_08jul26_449_e.htm" },
    ];
    const { error } = await sb.from("domain_events").insert(events);
    if (error) throw error;
    const { count } = await sb.from("domain_events").select("id", { count: "exact", head: true });
    console.log(`  Rows: ${count}`);
  });

  // P-D: tracker_state_log - backfill from most recent velocity_scores
  await run("P-D: Backfill tracker_state_log", async () => {
    // Get most recent score for each tracker
    const { data: scores } = await sb
      .from("velocity_scores")
      .select("tracker_slug, score, calculated_at")
      .order("calculated_at", { ascending: false });

    if (!scores) throw new Error("No velocity_scores found");

    // Get latest per slug
    const latest = new Map<string, { score: number; calculated_at: string }>();
    for (const s of scores) {
      if (!latest.has(s.tracker_slug) && s.tracker_slug !== "governance") {
        latest.set(s.tracker_slug, { score: s.score, calculated_at: s.calculated_at });
      }
    }

    const rows = [...latest.entries()].map(([slug, { score, calculated_at }]) => ({
      tracker_slug: slug,
      band: score < 4.0 ? "LOW" : score < 7.0 ? "WATCH" : "ELEVATED",
      score,
      entered_at: calculated_at,
    }));

    const { error } = await sb.from("tracker_state_log").insert(rows);
    if (error) throw error;
    const { count } = await sb.from("tracker_state_log").select("id", { count: "exact", head: true });
    console.log(`  Rows: ${count}`);
  });

  // P-C: domain_validation is intentionally empty
  await run("P-C: Verify domain_validation empty", async () => {
    const { count } = await sb.from("domain_validation").select("id", { count: "exact", head: true });
    console.log(`  Rows: ${count} (expected 0)`);
  });

  // P-E: user_alert_preferences columns already added via SQL
  await run("P-E: Verify alert_preferences columns", async () => {
    const { data, error } = await sb.from("user_alert_preferences").select("alert_on_state_change, alert_on_band_crossing").limit(1);
    if (error) throw error;
    console.log(`  Columns exist, sample: ${JSON.stringify(data)}`);
  });

  // ============================================================
  // VERIFICATION SELECTs
  // ============================================================
  console.log("\n\n========== VERIFICATION ==========\n");

  const { data: trackers } = await sb.from("trackers").select("slug, display_name, tier, institutional_type").order("slug");
  console.log("TRACKERS TABLE:");
  (trackers || []).forEach((t: any) => console.log(`  ${t.slug} | ${t.display_name} | ${t.tier} | ${t.institutional_type}`));

  const { data: events } = await sb.from("domain_events").select("tracker_slug, name, event_date, kind").order("event_date");
  console.log(`\nDOMAIN_EVENTS (${events?.length} rows):`);
  (events || []).forEach((e: any) => console.log(`  ${e.event_date} | ${e.tracker_slug} | ${e.kind} | ${e.name}`));

  const { count: valCount } = await sb.from("domain_validation").select("id", { count: "exact", head: true });
  console.log(`\nDOMAIN_VALIDATION: ${valCount} rows (expected 0)`);

  const { data: stateLog } = await sb.from("tracker_state_log").select("tracker_slug, band, score, entered_at").order("tracker_slug");
  console.log(`\nTRACKER_STATE_LOG (${stateLog?.length} rows):`);
  (stateLog || []).forEach((s: any) => console.log(`  ${s.tracker_slug} | ${s.band} | ${s.score} | ${s.entered_at?.slice(0, 10)}`));
}

main().catch(console.error);
