import { createClient } from "@supabase/supabase-js";

const EVENTS = [
  // IMO Shipping
  { id: "evt-imo-001", tracker_slug: "imo-shipping", event_date: "2026-04-27", title: "MEPC 84 convenes in London", summary: "IMO Marine Environment Protection Committee session 84. Net-zero framework vote expected. Key outcome for GHG strategy.", event_type: "milestone", source_url: "https://www.imo.org/en/MediaCentre/MeetingSummaries" },
  { id: "evt-imo-002", tracker_slug: "imo-shipping", event_date: "2026-01-01", title: "FuelEU Maritime enters into force", summary: "EU regulation requiring cleaner fuels for large ships calling at EU ports. Applies to vessels over 5000 GT.", event_type: "milestone", source_url: "https://transport.ec.europa.eu" },
  { id: "evt-imo-003", tracker_slug: "imo-shipping", event_date: "2025-03-01", title: "EU ETS shipping \u2014 first compliance period closes", summary: "First reporting period under EU Emissions Trading System for maritime closes. Shipping companies must surrender allowances.", event_type: "update", source_url: "https://www.europarl.europa.eu" },

  // WTO Fisheries
  { id: "evt-wto-001", tracker_slug: "wto-fisheries", event_date: "2026-09-15", title: "WTO Fisheries Subsidies Agreement \u2014 compliance deadline", summary: "Members must bring domestic subsidy regimes into compliance with the Agreement on Fisheries Subsidies.", event_type: "milestone", source_url: "https://www.wto.org/english/tratop_e/fish_e" },
  { id: "evt-wto-002", tracker_slug: "wto-fisheries", event_date: "2026-02-01", title: "Fish Two Geneva session \u2014 implementation review", summary: "WTO Fisheries Subsidies Committee meets to review implementation progress and hear member state reports.", event_type: "update", source_url: "https://www.wto.org" },
  { id: "evt-wto-003", tracker_slug: "wto-fisheries", event_date: "2025-11-01", title: "Agreement on Fisheries Subsidies enters into force", summary: "Ratification threshold met. Agreement binding on members. First multilateral agreement to target a specific sector\u2019s environmental impact.", event_type: "milestone", source_url: "https://www.wto.org" },

  // Offshore Wind
  { id: "evt-wind-001", tracker_slug: "offshore-wind", event_date: "2026-01-01", title: "US appellate ruling on offshore wind lease suspension", summary: "Federal appellate court expected to rule on offshore wind lease suspension challenged by developers. Outcome determines future of Atlantic wind buildout.", event_type: "milestone", source_url: "https://www.boem.gov" },
  { id: "evt-wind-002", tracker_slug: "offshore-wind", event_date: "2025-11-01", title: "Crown Estate Round 5 \u2014 seabed lease awards confirmed", summary: "UK Crown Estate confirms successful bidders for Round 5 offshore wind leases. Largest leasing round in UK history.", event_type: "milestone", source_url: "https://www.thecrownestate.co.uk" },
  { id: "evt-wind-003", tracker_slug: "offshore-wind", event_date: "2025-06-01", title: "EU MSP Directive \u2014 member state plan submission deadline", summary: "EU member states required to submit updated maritime spatial plans under the revised MSP Directive.", event_type: "update", source_url: "https://maritime-spatial-planning.ec.europa.eu" },

  // CITES Marine
  { id: "evt-cites-001", tracker_slug: "cites-marine", event_date: "2025-11-14", title: "CITES CoP20 \u2014 shark and ray listing proposals tabled", summary: "Conference of the Parties considers Appendix II listings for blue shark, shortfin mako, and multiple ray species.", event_type: "milestone", source_url: "https://cites.org/eng/cop" },
  { id: "evt-cites-002", tracker_slug: "cites-marine", event_date: "2026-03-01", title: "Blue shark Appendix II listing \u2014 trade controls begin", summary: "Following CoP20 decision, trade in blue shark products requires CITES permits. Estimated 20 million blue sharks traded annually before listing.", event_type: "update", source_url: "https://cites.org" },
  { id: "evt-cites-003", tracker_slug: "cites-marine", event_date: "2026-06-01", title: "CITES trade database annual review \u2014 marine species", summary: "CITES Secretariat publishes annual trade data review covering all marine species listed under Appendices I and II.", event_type: "update", source_url: "https://trade.cites.org" },
];

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing SUPABASE env vars. URL:", !!url, "KEY:", !!key); process.exit(1); }
  const supabase = createClient(url, key);
  console.log(`Upserting ${EVENTS.length} tracker events...`);

  const { error } = await supabase
    .from("tracker_events")
    .upsert(EVENTS, { onConflict: "id" });

  if (error) {
    console.error("Upsert error:", error.message);
    process.exit(1);
  }

  const slugs = ["imo-shipping", "wto-fisheries", "offshore-wind", "cites-marine"];
  for (const slug of slugs) {
    const { count } = await supabase
      .from("tracker_events")
      .select("id", { count: "exact", head: true })
      .eq("tracker_slug", slug);
    console.log(`  ${slug}: ${count} events`);
  }

  console.log("Done.");
}

seed();
