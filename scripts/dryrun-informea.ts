/**
 * InforMEA OData dry-run diagnostic.
 * Hits the API with a 30-day window, language=en, adopted/in-force status.
 * NO DB WRITES. Shows totals, distinct MEAs, and sample records.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/dryrun-informea.ts
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/dryrun-informea.ts --days 365
 */

const BASE = "http://odata.informea.org/informea.svc";
const PAGE_SIZE = 100;
const DELAY_MS = 600;

const DAYS = (() => {
  const idx = process.argv.indexOf("--days");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : 30;
})();

const SINCE = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
const SINCE_ISO = SINCE.toISOString().replace("Z", "").slice(0, 19); // OData datetime format

// Ocean-relevant MEA treaties
const OCEAN_TREATIES: { id: string; name: string; filterTitle: boolean }[] = [
  { id: "cbd",              name: "CBD",                                            filterTitle: true  },
  { id: "cites",            name: "CITES",                                          filterTitle: true  },
  { id: "cms",              name: "CMS (Migratory Species)",                        filterTitle: true  },
  { id: "ICRW",             name: "IWC (Whaling)",                                 filterTitle: false },
  { id: "barcelona",        name: "Barcelona Convention (Mediterranean)",           filterTitle: false },
  { id: "bbnj",             name: "BBNJ High Seas Treaty",                         filterTitle: false },
  { id: "unclos",           name: "UNCLOS",                                         filterTitle: false },
  { id: "ascobans",         name: "ASCOBANS (Small Cetaceans)",                    filterTitle: false },
  { id: "acap",             name: "ACAP (Albatrosses and Petrels)",                filterTitle: true  },
  { id: "ramsar",           name: "Ramsar (Wetlands)",                             filterTitle: true  },
  { id: "abidjan",          name: "Abidjan Convention (West/Central Africa)",      filterTitle: false },
  { id: "noumea",           name: "Noumea Convention (South Pacific)",             filterTitle: false },
  { id: "cartagena-conv",   name: "Cartagena Convention (Wider Caribbean)",        filterTitle: false },
  { id: "jeddah",           name: "Jeddah Convention (Red Sea/Gulf of Aden)",      filterTitle: false },
  { id: "nairobi",          name: "Nairobi Convention (Eastern Africa)",           filterTitle: false },
  { id: "antigua",          name: "Antigua Convention (Northeast Pacific)",        filterTitle: false },
  { id: "kuwait",           name: "Kuwait Convention (Arabian Gulf)",              filterTitle: false },
];

// Subject terms indicating ocean relevance (for title-filtered treaties)
const OCEAN_KEYWORDS = [
  "marine", "ocean", "fisheries", "fishery", "fishing", "fish", "sea", "seabed",
  "coastal", "coast", "biodiversity", "whaling", "whale", "dolphin", "cetacean",
  "high seas", "exclusive economic zone", "eez", "bycatch", "tuna", "shark", "ray",
  "manta", "coral", "reef", "mangrove", "turtle", "dugong", "manatee",
  "seahorse", "sawfish", "sturgeon", "humphead", "pelagic", "deep-sea", "deep sea",
  "benthic", "port state", "flag state", "iuu", "vessel", "mediterranean",
  "caribbean", "pacific", "atlantic", "arctic", "antarctic", "plastic",
];

const CITES_MARINE_TERMS = [
  "shark", "ray", "manta", "turtle", "seahorse", "coral", "humphead",
  "sawfish", "dugong", "manatee", "sturgeon", "marine", "ocean", "fish", "sea",
];

function isOceanRelevant(title: string, treatyId: string): boolean {
  const lower = title.toLowerCase();
  const alwaysPass = ["ICRW", "bbnj", "unclos", "ascobans",
    "barcelona", "abidjan", "noumea", "cartagena-conv",
    "jeddah", "nairobi", "antigua", "kuwait"];
  if (alwaysPass.includes(treatyId)) return true;
  if (treatyId === "cites") return CITES_MARINE_TERMS.some(k => lower.includes(k));
  return OCEAN_KEYWORDS.some(k => lower.includes(k));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface ODataTitle { language: string; value: string; }
interface ODataFile { url: string; language: string; mimeType: string; filename: string; }
interface ODataDecision {
  id: string; number: string; treaty: string; type: string;
  status: string; published: string | null; link: string | null;
  title: { results: ODataTitle[] };
  files: { results: ODataFile[] };
}

interface SampleRecord {
  treatyName: string;
  number: string;
  title: string;
  status: string;
  published: string;
  type: string;
  pdfUrl: string | null; // null = HTML-only, no attached PDF
  decisionLink: string;
}

// Parse OData v2 /Date(ms)/ format to JS Date
function parseODataDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const m = val.match(/\/Date\((-?\d+)\)\//);
  if (!m) return null;
  return new Date(parseInt(m[1], 10));
}

async function fetchDecisions(treatyId: string, skip: number): Promise<ODataDecision[]> {
  // NOTE: InforMEA OData v2 datetime filter doesn't work on this endpoint.
  // Date filtering is done client-side by parsing /Date(ms)/ format.
  const url =
    `${BASE}/Decisions?$filter=treaty eq '${treatyId}'` +
    `&$expand=title,files&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Tideline Library Bot/1.0 (dry-run diagnostic)" },
    });
    if (!res.ok) {
      console.log(`  HTTP ${res.status} for treaty=${treatyId} skip=${skip}`);
      return [];
    }
    const json = await res.json();
    return json?.d?.results || [];
  } catch (e) {
    console.log(`  Fetch error for treaty=${treatyId}: ${(e as Error).message}`);
    return [];
  }
}

async function main() {
  console.log(`\n=== InforMEA OData DRY RUN (last ${DAYS} days, since ${SINCE.toISOString().slice(0, 10)}) ===`);
  console.log(`Status filter: adopted | in force only`);
  console.log(`NO DB WRITES — review output and approve before inserting.\n`);

  let totalFetched = 0;
  let totalPassed = 0;
  let totalStatusFiltered = 0;
  let totalOceanFiltered = 0;
  let totalNoTitle = 0;
  let totalNoPdf = 0;
  const byTreaty: Record<string, number> = {};
  const samples: SampleRecord[] = [];

  for (const treaty of OCEAN_TREATIES) {
    let skip = 0;
    let treatyCount = 0;

    while (true) {
      const decisions = await fetchDecisions(treaty.id, skip);
      if (decisions.length === 0) break;

      for (const dec of decisions) {
        totalFetched++;

        // Status gate — InforMEA uses "active" for adopted/in-force decisions.
        // Exclude: "draft", "recommended", "withdrawn", "deleted", empty.
        const status = (dec.status || "").toLowerCase();
        const EXCLUDED_STATUSES = ["draft", "recommended", "withdrawn", "deleted", ""];
        if (EXCLUDED_STATUSES.includes(status)) {
          totalStatusFiltered++;
          continue;
        }

        // Date gate (client-side — OData server datetime filter doesn't work on this endpoint)
        const pubDate = parseODataDate(dec.published);
        if (pubDate && pubDate < SINCE) {
          totalStatusFiltered++; // reuse counter for "too old"
          continue;
        }

        // English title
        const enTitle = (dec.title?.results || []).find(t => t.language === "en");
        if (!enTitle?.value) { totalNoTitle++; continue; }

        // Ocean relevance
        if (treaty.filterTitle && !isOceanRelevant(enTitle.value, treaty.id)) {
          totalOceanFiltered++;
          continue;
        }

        // English PDF (optional — log HTML-only decisions separately)
        const enPdf = (dec.files?.results || []).find(
          f => f.language === "en" && f.mimeType === "application/pdf" && f.url
        );
        if (!enPdf) {
          totalNoPdf++;
          // Still include in samples as HTML-only (decision link only, no PDF)
          if (samples.length < 10) {
            samples.push({
              treatyName: treaty.name,
              number: dec.number || dec.id,
              title: enTitle.value,
              status: dec.status,
              published: pubDate ? pubDate.toISOString().slice(0, 10) : (dec.published || "unknown"),
              type: dec.type || "unknown",
              pdfUrl: null,
              decisionLink: dec.link || `${BASE}/Decisions('${dec.id}')`,
            });
          }
          continue;
        }

        totalPassed++;
        treatyCount++;
        byTreaty[treaty.name] = (byTreaty[treaty.name] || 0) + 1;

        if (samples.length < 10) {
          samples.push({
            treatyName: treaty.name,
            number: dec.number || dec.id,
            title: enTitle.value,
            status: dec.status,
            published: pubDate ? pubDate.toISOString().slice(0, 10) : (dec.published || "unknown"),
            type: dec.type || "unknown",
            pdfUrl: enPdf.url,
            decisionLink: dec.link || `${BASE}/Decisions('${dec.id}')`,
          });
        }
      }

      if (decisions.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
      await sleep(DELAY_MS);
    }

    if (treatyCount > 0) {
      console.log(`  [${treaty.name}] ${treatyCount} qualifying decisions`);
    }
  }

  console.log(`\n=== TOTALS ===`);
  console.log(`  Total fetched from API         : ${totalFetched}`);
  console.log(`  Filtered (status/date excluded): ${totalStatusFiltered}`);
  console.log(`  Filtered (not ocean-relevant)  : ${totalOceanFiltered}`);
  console.log(`  Filtered (no English title)    : ${totalNoTitle}`);
  console.log(`  Filtered (no English PDF)      : ${totalNoPdf}`);
  console.log(`  Qualifying (would be queued)   : ${totalPassed}`);

  console.log(`\n=== DISTINCT MEAs WITH QUALIFYING DECISIONS ===`);
  const sortedTreaties = Object.entries(byTreaty).sort((a, b) => b[1] - a[1]);
  if (sortedTreaties.length === 0) {
    console.log(`  (none — date window too narrow or API returned no decisions)`);
  } else {
    sortedTreaties.forEach(([name, n]) => console.log(`  ${String(n).padStart(3)}  ${name}`));
  }

  console.log(`\n=== SAMPLE RECORDS (first ${samples.length}) ===`);
  if (samples.length === 0) {
    console.log(`  No records matched the date+status+ocean filter.`);
    console.log(`  Try: npx tsx scripts/dryrun-informea.ts --days 365`);
  } else {
    samples.forEach((s, i) => {
      console.log(`\n[${i + 1}] ${s.published} | ${s.treatyName}`);
      console.log(`    Number  : ${s.number}`);
      console.log(`    Title   : ${s.title}`);
      console.log(`    Status  : ${s.status}`);
      console.log(`    Type    : ${s.type}`);
      console.log(`    PDF     : ${s.pdfUrl ?? "(none — HTML-only, use decision link)"}`);
      console.log(`    HasPDF  : ${s.pdfUrl ? "yes" : "NO — HTML only"}`);
      console.log(`    Record  : ${s.decisionLink}`);
    });
  }

  console.log(`\n=== TRACKER UPLIFT ASSESSMENT ===`);
  console.log(`  cites_marine   : ${byTreaty["CITES"] ?? 0} decisions`);
  console.log(`  bbnj           : ${(byTreaty["CBD"] ?? 0) + (byTreaty["BBNJ High Seas Treaty"] ?? 0) + (byTreaty["UNCLOS"] ?? 0)} decisions (CBD+BBNJ+UNCLOS)`);
  console.log(`  30x30          : ${(byTreaty["CBD"] ?? 0) + (byTreaty["Ramsar (Wetlands)"] ?? 0)} decisions (CBD+Ramsar)`);
  console.log(`  wto_fisheries  : 0 (NOT in InforMEA — WTO is a trade body)`);
  console.log(`  imo_shipping   : 0 (NOT in InforMEA — IMO is not an MEA)`);
  console.log(`  isa            : 0 (NOT in InforMEA — ISA is UNCLOS body, not MEA)`);
  console.log(`\n  WTO gap: add IISD ENB RSS or WTO press feed to sources.ts to fill wto_fisheries.`);
  console.log(`\nDRY RUN COMPLETE — no DB writes made. Re-run with --days 365 for backfill scope.`);
}

main().catch(console.error);
