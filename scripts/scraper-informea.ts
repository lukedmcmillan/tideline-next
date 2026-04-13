import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "http://odata.informea.org/informea.svc";
const PAGE_SIZE = 100;
const DELAY_MS = 500;

// Ocean-relevant MEA treaty IDs from InforMEA OData
const OCEAN_TREATIES: { id: string; name: string }[] = [
  { id: "cbd", name: "Convention on Biological Diversity" },
  { id: "cites", name: "Convention on International Trade in Endangered Species" },
  { id: "cms", name: "Convention on the Conservation of Migratory Species" },
  { id: "ICRW", name: "International Convention for the Regulation of Whaling" },
  { id: "barcelona", name: "Barcelona Convention (Mediterranean)" },
  { id: "bbnj", name: "BBNJ High Seas Treaty" },
  { id: "unclos", name: "United Nations Convention on the Law of the Sea" },
  { id: "ascobans", name: "Agreement on Conservation of Small Cetaceans (Baltic/North Sea)" },
  { id: "acap", name: "Agreement on Conservation of Albatrosses and Petrels" },
  { id: "ramsar", name: "Ramsar Convention on Wetlands" },
  { id: "abidjan", name: "Abidjan Convention (West/Central Africa)" },
  { id: "noumea", name: "Noumea Convention (South Pacific)" },
  { id: "cartagena-conv", name: "Cartagena Convention (Wider Caribbean)" },
  { id: "jeddah", name: "Jeddah Convention (Red Sea/Gulf of Aden)" },
  { id: "nairobi", name: "Nairobi Convention (Eastern Africa)" },
  { id: "antigua", name: "Antigua Convention (Northeast Pacific)" },
  { id: "kuwait", name: "Kuwait Convention (Arabian Gulf)" },
];

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
  published: string | null; // "/Date(ms)/" format
  link: string | null;
  title: { results: ODataTitle[] };
  files: { results: ODataFile[] };
}

function parseODataDate(raw: string | null): string | null {
  if (!raw) return null;
  const match = raw.match(/\/Date\((\d+)\)\//);
  if (!match) return null;
  const d = new Date(parseInt(match[1], 10));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "unknown.pdf");
  } catch {
    return "unknown.pdf";
  }
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

async function fetchDecisions(
  treatyId: string,
  skip: number
): Promise<ODataDecision[]> {
  const url =
    `${BASE}/Decisions?$filter=treaty eq '${treatyId}'` +
    `&$expand=title,files&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Tideline Library Bot/1.0" },
  });

  if (!res.ok) {
    console.log(`  HTTP ${res.status} for treaty=${treatyId} skip=${skip}`);
    return [];
  }

  const json = await res.json();
  return json?.d?.results || [];
}

async function scrapeTreaty(treaty: { id: string; name: string }): Promise<number> {
  console.log(`[${treaty.name}] Starting`);
  let skip = 0;
  let totalQueued = 0;
  let totalSkipped = 0;
  let totalNoFile = 0;

  while (true) {
    const decisions = await fetchDecisions(treaty.id, skip);
    if (decisions.length === 0) break;

    for (const dec of decisions) {
      // Get English title
      const titles = dec.title?.results || [];
      const enTitle = titles.find((t) => t.language === "en");
      if (!enTitle || !enTitle.value) {
        totalSkipped++;
        continue;
      }

      // Get English PDF file
      const files = dec.files?.results || [];
      const enPdf = files.find(
        (f) => f.language === "en" && f.mimeType === "application/pdf" && f.url
      );
      if (!enPdf) {
        totalNoFile++;
        continue;
      }

      // Dedup check
      const exists = await isAlreadyQueued(enPdf.url);
      if (exists) {
        totalSkipped++;
        continue;
      }

      // Queue it
      const { error } = await supabase.from("document_queue").insert({
        source_url: dec.link || `${BASE}/Decisions('${dec.id}')`,
        source_domain: "informea.org",
        file_url: enPdf.url,
        file_name: enPdf.filename || fileNameFromUrl(enPdf.url),
        is_primary_source: true,
        status: "pending",
      });

      if (!error) {
        totalQueued++;
      } else if (!error.message.includes("duplicate")) {
        console.log(`  Insert error: ${error.message}`);
      }
    }

    console.log(
      `  [${treaty.name}] Page ${skip / PAGE_SIZE + 1}: ` +
        `${decisions.length} decisions fetched, ${totalQueued} queued so far`
    );

    if (decisions.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
    await sleep(DELAY_MS);
  }

  console.log(
    `[${treaty.name}] Done — ${totalQueued} queued, ${totalSkipped} skipped, ${totalNoFile} no English PDF\n`
  );
  return totalQueued;
}

async function main() {
  console.log("=== Tideline InforMEA OData Scraper ===");
  console.log(`Querying ${OCEAN_TREATIES.length} ocean-relevant treaties\n`);

  let grandTotal = 0;

  for (const treaty of OCEAN_TREATIES) {
    const count = await scrapeTreaty(treaty);
    grandTotal += count;
    await sleep(DELAY_MS);
  }

  console.log(`=== Complete. ${grandTotal} new PDFs queued from InforMEA. ===`);
}

main().catch(console.error);
