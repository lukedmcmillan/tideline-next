import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Old OData endpoint — redirects but works (http -> https behind nginx)
const BASE = "http://odata.informea.org/informea.svc";
const PAGE_SIZE = 100;
const DELAY_MS = 500;

// Display abbreviation for decision identifier construction (e.g. "CITES Decision 20.49")
const TREATY_ABBREV: Record<string, string> = {
  cbd: "CBD", cites: "CITES", cms: "CMS", ICRW: "IWC",
  barcelona: "BARCELONA", bbnj: "BBNJ", unclos: "UNCLOS", ascobans: "ASCOBANS",
  acap: "ACAP", ramsar: "RAMSAR", abidjan: "ABIDJAN", noumea: "NOUMEA",
  "cartagena-conv": "CARTAGENA", jeddah: "JEDDAH", nairobi: "NAIROBI",
  antigua: "ANTIGUA", kuwait: "KUWAIT",
};

// Ocean-relevant MEA treaty IDs from InforMEA OData
const OCEAN_TREATIES: { id: string; name: string; filterTitle: boolean }[] = [
  { id: "cbd",           name: "Convention on Biological Diversity",              filterTitle: true  },
  { id: "cites",         name: "CITES",                                            filterTitle: true  },
  { id: "cms",           name: "Convention on Migratory Species",                 filterTitle: true  },
  { id: "ICRW",          name: "International Convention for Regulation of Whaling", filterTitle: false }, // all whale-related
  { id: "barcelona",     name: "Barcelona Convention (Mediterranean)",            filterTitle: false }, // all marine
  { id: "bbnj",          name: "BBNJ High Seas Treaty",                           filterTitle: false }, // all ocean
  { id: "unclos",        name: "UNCLOS",                                           filterTitle: false }, // all ocean
  { id: "ascobans",      name: "ASCOBANS (Small Cetaceans)",                      filterTitle: false }, // all cetacean
  { id: "acap",          name: "ACAP (Albatrosses and Petrels)",                  filterTitle: true  },
  { id: "ramsar",        name: "Ramsar Convention on Wetlands",                   filterTitle: true  },
  { id: "abidjan",       name: "Abidjan Convention (West/Central Africa)",        filterTitle: false }, // all marine
  { id: "noumea",        name: "Noumea Convention (South Pacific)",               filterTitle: false }, // all marine
  { id: "cartagena-conv",name: "Cartagena Convention (Wider Caribbean)",          filterTitle: false }, // all marine
  { id: "jeddah",        name: "Jeddah Convention (Red Sea/Gulf of Aden)",        filterTitle: false }, // all marine
  { id: "nairobi",       name: "Nairobi Convention (Eastern Africa)",             filterTitle: false }, // all marine
  { id: "antigua",       name: "Antigua Convention (Northeast Pacific)",          filterTitle: false }, // all marine
  { id: "kuwait",        name: "Kuwait Convention (Arabian Gulf)",                filterTitle: false }, // all marine
];

// Ocean relevance keywords — tested against English decision title
const OCEAN_KEYWORDS = [
  "marine", "ocean", "fisheries", "fishery", "fishing", "fish",
  "sea", "seabed", "coastal", "coast",
  "biodiversity", "whaling", "whale", "dolphin", "cetacean",
  "high seas", "icz", "exclusive economic zone", "eez",
  "bycatch", "tuna", "shark", "ray", "manta",
  "coral", "reef", "mangrove",
  "turtle", "dugong", "manatee", "sirenian",
  "seahorse", "sawfish", "sturgeon", "humphead",
  "pelagic", "deep-sea", "deep sea", "benthic",
  "port state", "flag state", "iuu", "vessel",
  "mediterranean", "caribbean", "pacific", "atlantic", "arctic", "antarctic",
];

// CITES marine-species terms — decisions about these species always pass
const CITES_MARINE_TERMS = [
  "shark", "ray", "manta", "turtle", "sea turtle", "seahorse", "coral",
  "humphead", "sawfish", "dugong", "manatee", "sturgeon", "eel",
  "marine", "ocean", "fish", "sea", "coastal", "pelagic",
];

function isOceanRelevant(title: string, treatyId: string): boolean {
  const lower = title.toLowerCase();

  // IWC, BBNJ, UNCLOS, regional sea conventions — always pass
  const alwaysPass = ["ICRW", "bbnj", "unclos", "ascobans",
    "barcelona", "abidjan", "noumea", "cartagena-conv",
    "jeddah", "nairobi", "antigua", "kuwait"];
  if (alwaysPass.includes(treatyId)) return true;

  // CITES — use marine species terms
  if (treatyId === "cites") {
    return CITES_MARINE_TERMS.some(k => lower.includes(k));
  }

  // All others — use general ocean keyword list
  return OCEAN_KEYWORDS.some(k => lower.includes(k));
}

interface ODataTitle {
  language: string;
  value: string;
}

interface ODataFile {
  url: string;
  language: string;
  mimeType: string;
  filename: string;
}

interface ODataDecision {
  id: string;
  number: string;
  treaty: string;
  type: string;
  status: string;
  published: string | null;
  link: string | null;
  title: { results: ODataTitle[] };
  files: { results: ODataFile[] };
}

// Parse OData v2 /Date(milliseconds)/ format to JS Date
function parseODataDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const m = val.match(/\/Date\((-?\d+)\)\//);
  if (!m) return null;
  return new Date(parseInt(m[1], 10));
}

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "unknown.pdf");
  } catch {
    return "unknown.pdf";
  }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "unknown"; }
}

// Build machine-safe decision identifier slug stored as file_name in the queue.
// Pattern mirrors UN document symbol convention (e.g. A_RES_77_312.pdf).
// Examples:
//   "20.49"               -> "CITES_DEC_20_49"
//   "19.178 (Rev. CoP20)" -> "CITES_DEC_19_178_REV_COP20"
// The processor parses the slug back to a human-readable primary title.
function buildDecisionFileName(treatyId: string, decNumber: string | null): string {
  const abbrev = TREATY_ABBREV[treatyId] || treatyId.toUpperCase();
  if (!decNumber) return `${abbrev}_DEC_UNKNOWN`;
  const slug = decNumber
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${abbrev}_DEC_${slug}`;
}

// Strip em dashes per CLAUDE-RULES.md copy rules: replace with en dash
function sanitiseTitle(title: string): string {
  return title.replace(/\u2014/g, "\u2013").replace(/--/g, "-").trim();
}

async function isAlreadyQueued(fileUrl: string): Promise<boolean> {
  const { data: q } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  if (q && q.length > 0) return true;

  const { data: d } = await supabase
    .from("documents")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  return !!(d && d.length > 0);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchDecisions(treatyId: string, skip: number): Promise<ODataDecision[]> {
  const url =
    `${BASE}/Decisions?$filter=treaty eq '${treatyId}'` +
    `&$expand=title,files&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;

  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Tideline Library Bot/1.0" },
  });

  if (!res.ok) {
    console.log(`  HTTP ${res.status} for treaty=${treatyId} skip=${skip}`);
    return [];
  }

  const json = await res.json();
  return json?.d?.results || [];
}

interface TreatyResult {
  queued: number;
  queuedHtml: number;
  skippedDup: number;
  skippedStatus: number;
  skippedNoTitle: number;
  skippedNoFile: number;
  skippedOceanFilter: number;
  errors: number;
}

// Statuses that mean a decision is not in force / adopted — skip these
const EXCLUDED_STATUSES = new Set(["draft", "recommended", "withdrawn", "deleted", ""]);

async function scrapeTreaty(treaty: { id: string; name: string; filterTitle: boolean }): Promise<TreatyResult> {
  console.log(`\n[${treaty.name}] Starting (filter=${treaty.filterTitle})`);
  let skip = 0;
  const result: TreatyResult = {
    queued: 0, queuedHtml: 0, skippedDup: 0, skippedStatus: 0,
    skippedNoTitle: 0, skippedNoFile: 0, skippedOceanFilter: 0, errors: 0,
  };
  let processed = 0;

  while (true) {
    const decisions = await fetchDecisions(treaty.id, skip);
    if (decisions.length === 0) break;

    for (const dec of decisions) {
      // Status gate — only index adopted / in-force decisions (InforMEA uses "active")
      const status = (dec.status || "").toLowerCase();
      if (EXCLUDED_STATUSES.has(status)) {
        result.skippedStatus++;
        processed++;
        continue;
      }

      // English title
      const titles = dec.title?.results || [];
      const enTitle = titles.find((t) => t.language === "en");
      if (!enTitle?.value) {
        result.skippedNoTitle++;
        processed++;
        continue;
      }

      // Ocean relevance filter
      if (treaty.filterTitle && !isOceanRelevant(enTitle.value, treaty.id)) {
        result.skippedOceanFilter++;
        processed++;
        continue;
      }

      // English PDF — preferred; HTML (dec.link) is the fallback
      const files = dec.files?.results || [];
      const enPdf = files.find(
        (f) => f.language === "en" && f.mimeType === "application/pdf" && f.url
      );

      let fileUrl: string;
      let sourceUrl: string;
      let sourceDomain: string;
      let fileName: string;
      let sourceFormat: "pdf" | "html";

      if (enPdf) {
        fileUrl = enPdf.url;
        sourceUrl = dec.link || `${BASE}/Decisions('${dec.id}')`;
        sourceDomain = "informea.org";
        fileName = enPdf.filename || fileNameFromUrl(enPdf.url);
        sourceFormat = "pdf";
      } else if (dec.link) {
        // HTML fallback: canonical authority URL (cites.org, cbd.int, etc.)
        fileUrl = dec.link;
        sourceUrl = `${BASE}/Decisions('${dec.id}')`;
        sourceDomain = extractDomain(dec.link);
        // Use decision identifier as filename so processor can build primary title
        fileName = buildDecisionFileName(treaty.id, dec.number);
        sourceFormat = "html";
      } else {
        result.skippedNoFile++;
        processed++;
        continue;
      }

      // Dedup — keyed on fileUrl (PDF URL or canonical HTML page URL)
      const exists = await isAlreadyQueued(fileUrl);
      if (exists) {
        result.skippedDup++;
        processed++;
        continue;
      }

      // Queue
      const { error } = await supabase.from("document_queue").insert({
        source_url:        sourceUrl,
        source_domain:     sourceDomain,
        file_url:          fileUrl,
        file_name:         fileName,
        is_primary_source: true,
        status:            "pending",
        source_format:     sourceFormat,
      });

      if (!error) {
        result.queued++;
        if (sourceFormat === "html") result.queuedHtml++;
      } else if (!error.message.includes("duplicate")) {
        result.errors++;
        if (result.errors <= 3) console.log(`  Insert error: ${error.message}`);
      }

      processed++;

      if (processed % 50 === 0) {
        console.log(
          `  [${treaty.name}] ${processed} processed — ${result.queued} queued ` +
          `(${result.queuedHtml} html), ${result.skippedDup} dup, ` +
          `${result.skippedOceanFilter} not ocean-relevant`
        );
      }
    }

    if (decisions.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
    await sleep(DELAY_MS);
  }

  console.log(
    `[${treaty.name}] Done — queued:${result.queued} (html:${result.queuedHtml}) ` +
    `dup:${result.skippedDup} status:${result.skippedStatus} ` +
    `noTitle:${result.skippedNoTitle} noFile:${result.skippedNoFile} ` +
    `oceanFilter:${result.skippedOceanFilter} errors:${result.errors}`
  );
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`=== Tideline InforMEA OData Scraper${dryRun ? " (DRY RUN)" : ""} ===`);
  console.log(`Querying ${OCEAN_TREATIES.length} ocean-relevant treaties\n`);

  const totals: TreatyResult = {
    queued: 0, queuedHtml: 0, skippedDup: 0, skippedStatus: 0,
    skippedNoTitle: 0, skippedNoFile: 0, skippedOceanFilter: 0, errors: 0,
  };

  for (const treaty of OCEAN_TREATIES) {
    const r = await scrapeTreaty(treaty);
    for (const k of Object.keys(totals) as (keyof TreatyResult)[]) totals[k] += r[k];
    await sleep(DELAY_MS);
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`  Queued (total):      ${totals.queued}`);
  console.log(`  Queued (HTML):       ${totals.queuedHtml}`);
  console.log(`  Queued (PDF):        ${totals.queued - totals.queuedHtml}`);
  console.log(`  Skipped (status):    ${totals.skippedStatus}`);
  console.log(`  Skipped (dup):       ${totals.skippedDup}`);
  console.log(`  Skipped (no title):  ${totals.skippedNoTitle}`);
  console.log(`  Skipped (no file):   ${totals.skippedNoFile}`);
  console.log(`  Skipped (not ocean): ${totals.skippedOceanFilter}`);
  console.log(`  Errors:              ${totals.errors}`);
}

main().catch(console.error);
