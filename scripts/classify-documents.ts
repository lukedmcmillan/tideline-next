/**
 * Source classification backfill for documents table.
 * RESEARCH-RAG-SPEC.md Step 1 (Section 3 + 4.1).
 *
 * Deterministic only — zero API calls.
 *
 * source_tier  = is_primary_source ? 'PRIMARY' : 'SECONDARY' (always set)
 * source_type  = deterministic lookup; NULL if no rule matches
 * needs_review = true when source_type is NULL
 * rule_applied = audit string for every row
 *
 * Resumable: skips any document where classified_at IS NOT NULL.
 * Pass --force to re-classify all documents (override resumability).
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FORCE = process.argv.includes("--force");
const PATCH = process.argv.includes("--patch"); // process only docs with source_type IS NULL

type SourceType = "GOVERNMENT" | "NGO" | "ACADEMIC" | "PRESS";
type SourceTier = "PRIMARY" | "SECONDARY";

// ---------------------------------------------------------------------------
// GOVERNMENT DOCUMENT TYPES — strongest signal, checked first
// ---------------------------------------------------------------------------

const GOV_DOC_TYPES = new Set([
  "regulation",
  "government_document",
  "resolution",
  "treaty",
]);

// ---------------------------------------------------------------------------
// URL DOMAIN ALLOWLIST → source_type
// ---------------------------------------------------------------------------

const DOMAIN_GOVERNMENT = new Set([
  "crm.iwc.int", "iwc.int",
  "cbd.int", "www.cbd.int",
  "ascobans.org", "www.ascobans.org",
  "informea.org", "www.informea.org",
  "isa.org.jm",
  "imo.org", "wwwcdn.imo.org",
  "un.org", "digitallibrary.un.org", "documents.un.org",
  "fao.org",
  "ospar.org",
  "cites.org",
  "ccamlr.org", "fishdocs.ccamlr.org",
  "eur-lex.europa.eu",
  "wto.org",
  "acobams.org",
  "ramsar.org",
  "cms.int",
  "itlos.org",
  "helcom.fi",
  "ipcc.ch",
  "unep.org",
]);

// TLD suffixes that always indicate a government domain
const GOV_TLD_SUFFIXES = [".gov", ".gov.uk", ".gc.ca", ".europa.eu"];

const DOMAIN_NGO = new Set([
  "oceana.org", "iucn.org",
  "wwf.org", "panda.org", "wwf.org.uk",
  "greenpeace.org",
  "whales.org", "uk.whales.org", "wdcs.org",
  "eia-international.org",
  "oceancare.org",
  "sas.org.uk",
  "clientearth.org",
  "pewtrusts.org",
  "awionline.org",
  "highseasalliance.org",
  "globalfishingwatch.org",
]);

const DOMAIN_PRESS = new Set([
  "reuters.com", "apnews.com", "bloomberg.com",
  "theguardian.com", "bbc.co.uk", "bbc.com",
  "carbonpulse.com", "climatechangenews.com",
]);

const DOMAIN_ACADEMIC = new Set([
  "nature.com", "sciencedirect.com", "frontiersin.org",
  "ices.dk", "onlinelibrary.wiley.com", "tandfonline.com",
  "jstor.org", "academic.oup.com", "plos.org", "pnas.org",
  "mbari.org", "whoi.edu", "scripps.ucsd.edu", "bas.ac.uk",
  "springer.com", "springerlink.com", "wiley.com",
  "taylorandfrancis.com", "cell.com",
]);

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/^https?:\/\/([^/?#]+)/);
  return m ? m[1].toLowerCase() : null;
}

function classifyByDomain(domain: string): SourceType | null {
  if (DOMAIN_GOVERNMENT.has(domain)) return "GOVERNMENT";
  if (GOV_TLD_SUFFIXES.some((s) => domain.endsWith(s))) return "GOVERNMENT";
  if (DOMAIN_NGO.has(domain)) return "NGO";
  if (DOMAIN_PRESS.has(domain)) return "PRESS";
  if (DOMAIN_ACADEMIC.has(domain)) return "ACADEMIC";
  return null;
}

// ---------------------------------------------------------------------------
// SOURCE ORGANISATION EXACT SETS
// ---------------------------------------------------------------------------

const NGO_EXACT = new Set([
  "OceanCare",
  "Oceana",
  "Ocean Conservancy",
  "WWF",
  "World Wide Fund for Nature",
  "IUCN",
  "International Union for Conservation of Nature",
  "Greenpeace",
  "WDC",
  "Whale and Dolphin Conservation",
  "Sea Shepherd",
  "Blue Marine Foundation",
  "Environmental Investigation Agency",
  "ClientEarth",
  "Pew Charitable Trusts",
  "Animal Welfare Institute",
  "High Seas Alliance",
  "Surfers Against Sewage",
  "Deep Sea Conservation Coalition",
  "DSCC",
  "Earthjustice",
  "Marine Conservation Society",
  "Marine Stewardship Council",
  "MSC",
  "Global Fishing Watch",
  "5 Gyres",
  // TNFD — both confirmed spellings from corpus (is_primary_source=true)
  "Taskforce on Nature-related Financial Disclosures (TNFD)",
  "Taskforce on Nature-related Financial Disclosures",
  // IUCN parenthetical variant (exact string confirmed)
  "International Union for Conservation of Nature (IUCN)",
  // ASMS — Swiss marine mammal NGO, both confirmed spellings
  "ASMS (Marine Mammal Protection)",
  "Swiss Working Group for the Protection of Marine Mammals (ASMS)",
  // Joint NGO publications
  "ECCEA and Ocean Care",
  // ORRAA
  "Ocean Risk and Resilience Action Alliance (ORRAA)",
  // Conservation NGO
  "Wildtracks",
]);

const GOVERNMENT_EXACT = new Set([
  // CCAMLR — both forms
  "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
  "CCAMLR (Commission for the Conservation of Antarctic Marine Living Resources)",
  "Commission for the Conservation of Antarctic Marine Living Resources",
  // CCSBT
  "Commission for the Conservation of Southern Bluefin Tuna (CCSBT)",
  "Commission for the Conservation of Southern Bluefin Tuna",
  // RFMOs
  "Indian Ocean Tuna Commission (IOTC)",
  "Indian Ocean Tuna Commission",
  "International Commission for the Conservation of Atlantic Tunas (ICCAT)",
  "Inter-American Tropical Tuna Commission (IATTC)",
  "Western and Central Pacific Fisheries Commission (WCPFC)",
  "Commission for the Conservation and Management of Highly Migratory Fish Stocks in the Western and Central Pacific Ocean",
  "General Fisheries Commission for the Mediterranean (GFCM)",
  "North East Atlantic Fisheries Commission (NEAFC)",
  "South Pacific Regional Fisheries Management Organisation",
  "Southern Indian Ocean Fisheries Agreement (SIOFA)",
  "Western Central Atlantic Fishery Commission (WECAFC)",
  "North Pacific Fisheries Commission",
  // ISA / IWC
  "International Seabed Authority",
  "International Whaling Commission",
  // ASCOBANS
  "ASCOBANS (Agreement on the Conservation of Small Cetaceans of the Baltic, North East Atlantic, Irish and North Seas)",
  "Agreement on the Conservation of Small Cetaceans of the Baltic, North East Atlantic, Irish and North Seas (ASCOBANS)",
  "UNEP/ASCOBANS",
  // CITES COP
  "Conference of the Parties to the Convention on Biological Diversity",
  "Conference of the Parties to the Convention on International Trade in Endangered Species of Wild Fauna and Flora (CITES)",
  "CITES Conference of the Parties",
  // EU institutions
  "European Commission",
  "Commission of the European Communities",
  "Council of the European Union",
  "European Parliament and Council of the European Union",
  "European Union",
  "European Economic Community",
  "European Community",
  // FAO — full name and language variants (parens form already above)
  "Food and Agriculture Organization of the United Nations (FAO)",
  "Food and Agriculture Organization of the United Nations",
  "FAO (Food and Agriculture Organization of the United Nations)",
  "Organización de las Naciones Unidas para la Alimentación y la Agricultura",
  "Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO)",
  "\u8054\u5408\u56fd\u7CAE\u98df\u53ca\u519c\u4e1a\u7ec4\u7ec7",                                       // Chinese FAO
  "\u041f\u0440\u043e\u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u0438 \u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0445\u043e\u0437\u044f\u0439\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f \u041e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u043d\u044b\u0445 \u041d\u0430\u0446\u0438\u0439", // Russian FAO
  "\u041f\u0440\u043e\u0434\u043e\u0432\u043e\u043b\u044c\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u0438 \u0441\u0435\u043b\u044c\u0441\u043a\u043e\u0445\u043e\u0437\u044f\u0439\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f \u041e\u0431\u044a\u0435\u0434\u0438\u043d\u0435\u043d\u043d\u044b\u0445 \u041d\u0430\u0446\u0438\u0439 (\u0424\u0410\u041e)", // Russian FAO with (ФАО) suffix
  "OECD/FAO",
  "Organisation for Economic Co-operation and Development (OECD) and Food and Agriculture Organization of the United Nations",
  "Organisation for Economic Co-operation and Development (OECD) and Food and Agriculture Organization (FAO)",
  // ISA in Russian
  "\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439 \u043e\u0440\u0433\u0430\u043d \u043f\u043e \u043c\u043e\u0440\u0441\u043a\u043e\u043c\u0443 \u0434\u043d\u0443 (\u0418\u0421\u0411\u0410)",
  // IMO parenthetical variant
  "International Maritime Organization (IMO)",
  // CLCS
  "Commission on the Limits of the Continental Shelf (CLCS)",
  // ACCOBAMS — intergovernmental agreement body under CMS
  "ACCOBAMS",
  // HELCOM — all confirmed variant spellings from corpus
  "Helsinki Commission (HELCOM)",
  "Baltic Marine Environment Protection Commission (HELCOM)",
  "HELCOM (Helsinki Commission)",
  "HELCOM-VASAB",
  "Helsinki Commission \u2013 HELCOM",    // en-dash as stored in DB
  // ICCAT short form + SCRS subsidiary bodies
  "ICCAT (International Commission for the Conservation of Atlantic Tunas)",
  "ICCAT",
  "SCRS (Scientific Committee of the Regional Fishery Body)",
  "SCRS (Standing Committee on Research and Statistics)",
  // ASCOBANS short form (long forms already present above)
  "ASCOBANS",
  // Fisheries bodies not previously listed
  "Bay of Bengal Large Marine Ecosystem Programme",
  "Lake Victoria Fisheries Organization",
  "Southeast Asian Fisheries Development Center (SEAFDEC)",
  // National environment agencies
  "Environment Protection Agency - Sierra Leone",
  "Environmental Protection Agency of the Maldives",
  // Convention on Migratory Species (short form; cms.int domain already in DOMAIN_GOVERNMENT)
  "Convention on Migratory Species (CMS)",
  // Other
  "Foyle, Carlingford and Irish Lights Commission",
]);

const ACADEMIC_EXACT = new Set([
  "ICES",
  "MBARI",
  "WHOI",
  "British Antarctic Survey",
  "Scripps",
  "Basque Centre for Climate Change (BC3)",
  // Multi-institution workshop proceedings (1 doc confirmed, exact string)
  "Shanghai Ocean University, Pacific Community, Australian National Centre for Ocean Resources and Security",
]);

// NGO prefix patterns — for multi-author/consortium NGO names where exact match fails.
// Lower-cased; matched via startsWith on the trimmed, lower-cased org string.
const NGO_STARTS: string[] = [
  "international union for conservation of nature (iucn),",   // catches "IUCN, Dona Berta..." multi-author variant
  "world economic forum,",                                      // catches WEF/ORRAA joint publications
];

// ---------------------------------------------------------------------------
// GOVERNMENT KEYWORD PATTERNS
// Applied only after NGO_EXACT check (step e before step f).
// GOV_STARTS: matched via startsWith (case-insensitive on trimmed string).
// GOV_INCLUDES: matched via includes (case-insensitive on trimmed string).
// NOTE: " authority" has a leading space — matches " authority" as a
// standalone word, not any org with "authority" as a substring fragment.
// ---------------------------------------------------------------------------

const GOV_STARTS: string[] = [
  // Sovereign state prefixes
  "republic of",
  "kingdom of",
  "commonwealth of",
  "state of",
  "federated states of",
  "independent state of",
  "principality of",
  "grand duchy of",
  // Legislative / executive bodies
  "government of",
  "parliament of",
  "congress of",
  // Intergovernmental
  "united nations",
  "un ",
  "international commission",
  "international seabed",
  "international whaling",
  "european commission",
];

const GOV_INCLUDES: string[] = [
  "government",
  "parliament",
  "oireachtas",
  " congress",
  "legislature",
  "ministry of",
  "ministry for",
  "minister of",
  "ministers",
  "department of",
  "secretary of state",
  "governor-general",
  "national oceanic",
  "noaa",
  "fisheries commission",
  "fisheries management",
  "fishery management",
  "fishery commission",
  "tuna commission",
  "secretariat",
  " authority",  // leading space: only matches when "authority" is a standalone word
];

function matchGovernmentPattern(org: string): string | null {
  const lower = org.toLowerCase();
  for (const p of GOV_STARTS) {
    if (lower.startsWith(p)) return `pattern:starts:${p}`;
  }
  for (const p of GOV_INCLUDES) {
    if (lower.includes(p)) return `pattern:includes:${p.trim()}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CLASSIFY ONE DOCUMENT
// ---------------------------------------------------------------------------

interface DocRow {
  id: string;
  is_primary_source: boolean;
  canonical_url: string | null;
  file_url: string | null;
  source_organisation: string | null;
  document_type: string | null;
  classified_at: string | null;
}

interface UpdateRow {
  id: string;
  source_type: SourceType | null;
  source_tier: SourceTier;
  source_domain: string | null;
  classified_at: string;
  rule_applied: string;
  needs_review: boolean;
}

function classifyDocument(doc: DocRow, now: string): UpdateRow {
  // source_tier: direct from is_primary_source, no other logic
  const source_tier: SourceTier = doc.is_primary_source ? "PRIMARY" : "SECONDARY";

  // source_domain: first available URL
  const rawUrl =
    doc.canonical_url ??
    (doc.file_url?.startsWith("http") ? doc.file_url : null);
  const source_domain = extractDomain(rawUrl);

  let source_type: SourceType | null = null;
  let rule_applied = "";

  // 1. Government document types (strongest editorial signal)
  if (!source_type && doc.document_type && GOV_DOC_TYPES.has(doc.document_type)) {
    source_type = "GOVERNMENT";
    rule_applied = `doctype:${doc.document_type}`;
  }

  // 2. NGO document type
  if (!source_type && doc.document_type === "ngo_report") {
    source_type = "NGO";
    rule_applied = "doctype:ngo_report";
  }

  // 3. Academic document type
  if (!source_type && doc.document_type === "scientific_paper") {
    source_type = "ACADEMIC";
    rule_applied = "doctype:scientific_paper";
  }

  // 4. URL domain allowlist
  if (!source_type && source_domain) {
    const t = classifyByDomain(source_domain);
    if (t) {
      source_type = t;
      rule_applied = `domain:${source_domain}`;
    }
  }

  // 5a. NGO exact match (before GOVERNMENT patterns)
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (NGO_EXACT.has(org)) {
      source_type = "NGO";
      rule_applied = `org:${org}`;
    }
  }

  // 5a-ii. NGO prefix patterns — multi-author/consortium names
  if (!source_type && doc.source_organisation) {
    const orgLower = doc.source_organisation.trim().toLowerCase();
    for (const prefix of NGO_STARTS) {
      if (orgLower.startsWith(prefix)) {
        source_type = "NGO";
        rule_applied = `ngo-starts:${prefix}`;
        break;
      }
    }
  }

  // 5b. GOVERNMENT exact match
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (GOVERNMENT_EXACT.has(org)) {
      source_type = "GOVERNMENT";
      rule_applied = `org:${org}`;
    }
  }

  // 6. GOVERNMENT keyword patterns (startsWith then includes)
  if (!source_type && doc.source_organisation) {
    const pattern = matchGovernmentPattern(doc.source_organisation.trim());
    if (pattern) {
      source_type = "GOVERNMENT";
      rule_applied = pattern;
    }
  }

  // 7. ACADEMIC exact match
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (ACADEMIC_EXACT.has(org)) {
      source_type = "ACADEMIC";
      rule_applied = `org:${org}`;
    }
  }

  // 8. No match
  if (!source_type) {
    rule_applied = "NULL—no match";
  }

  return {
    id: doc.id,
    source_type,
    source_tier,
    source_domain,
    classified_at: now,
    rule_applied,
    needs_review: source_type === null,
  };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Tideline Source Classification Backfill ===");
  const modeLabel = FORCE ? " [--force: re-classifying all docs]"
    : PATCH ? " [--patch: processing only docs with source_type IS NULL]"
    : "";
  console.log(`Zero API calls — deterministic pass only.${modeLabel}\n`);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE env vars. Run via: node_modules/.bin/tsx scripts/classify-documents.ts");
    process.exit(1);
  }

  // Paginate approved documents.
  // --patch: only docs where source_type IS NULL (targeted gap-fill, ~79 docs)
  // --force: all docs regardless of classified_at
  // default:  only docs where classified_at IS NULL (resumable full backfill)
  const allDocs: DocRow[] = [];
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    let q = supabase
      .from("documents")
      .select("id, is_primary_source, canonical_url, file_url, source_organisation, document_type, classified_at")
      .eq("status", "approved")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (PATCH) {
      q = q.is("source_type", null);
    }

    const { data, error } = await q;

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }
    if (!data || data.length === 0) break;
    allDocs.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`Documents fetched: ${allDocs.length}`);

  const toProcess = (FORCE || PATCH)
    ? allDocs
    : allDocs.filter((d) => !d.classified_at);
  const alreadyDone = allDocs.length - toProcess.length;
  if (alreadyDone > 0 && !FORCE && !PATCH) console.log(`Already classified (skipping): ${alreadyDone}`);
  console.log(`To classify: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("All documents already classified. Pass --force to re-classify.");
    return;
  }

  // Batch size for update — 100 rows per round trip
  const BATCH = 100;
  const counts: Record<string, number> = {
    GOVERNMENT: 0, NGO: 0, ACADEMIC: 0, PRESS: 0, NULL: 0,
  };
  let done = 0;
  const startTime = Date.now();
  const now = new Date().toISOString();

  for (let i = 0; i < toProcess.length; i += BATCH) {
    const batch = toProcess.slice(i, i + BATCH);
    const updates: UpdateRow[] = batch.map((doc) => {
      const row = classifyDocument(doc, now);
      const key = row.source_type ?? "NULL";
      counts[key] = (counts[key] || 0) + 1;
      return row;
    });

    // Parallel updates within each batch for throughput.
    const results = await Promise.all(
      updates.map((u) =>
        supabase
          .from("documents")
          .update({
            source_type:   u.source_type,
            source_tier:   u.source_tier,
            source_domain: u.source_domain,
            classified_at: u.classified_at,
            rule_applied:  u.rule_applied,
            needs_review:  u.needs_review,
          })
          .eq("id", u.id)
      )
    );
    const batchErrors = results.filter((r) => r.error);
    if (batchErrors.length > 0) {
      console.error(`  UPDATE ERROR (batch ${i}): ${batchErrors[0].error!.message} (${batchErrors.length} failed)`);
    }

    done += batch.length;
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);

    console.log(
      `[PROGRESS] ${done}/${toProcess.length} | ` +
        `GOV=${counts.GOVERNMENT} NGO=${counts.NGO} ` +
        `ACADEMIC=${counts.ACADEMIC} PRESS=${counts.PRESS} ` +
        `NULL=${counts.NULL} | ${elapsedSec}s`
    );
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Classification Run Complete ===`);
  console.log(`  Documents patched    : ${done}`);
  console.log(`  GOVERNMENT           : ${counts.GOVERNMENT}`);
  console.log(`  NGO                  : ${counts.NGO}`);
  console.log(`  ACADEMIC             : ${counts.ACADEMIC}`);
  console.log(`  PRESS                : ${counts.PRESS}`);
  console.log(`  NULL (needs_review)  : ${counts.NULL}`);
  console.log(`  Elapsed              : ${totalSec}s`);
  console.log(`  API cost             : $0.00`);

  // Post-run summary: rule_applied breakdown + fall-through check
  // Only run in --patch mode (the targeted gap-fill pass)
  if (PATCH && done > 0) {
    console.log(`\n=== Post-Run Verification (source_type IS NULL check) ===`);
    const { data: remaining, error: verifyErr } = await supabase
      .from("documents")
      .select("id, source_organisation, rule_applied, needs_review")
      .eq("status", "approved")
      .is("source_type", null);

    if (verifyErr) {
      console.error("  Verification query error:", verifyErr.message);
    } else {
      console.log(`  Docs still with NULL source_type: ${remaining?.length ?? "?"} (expect 5 — The Metals Company ×4, ROW ×1)`);
      if (remaining && remaining.length > 0) {
        console.log("  --- Remaining NULL docs ---");
        for (const d of remaining) {
          console.log(`    org: ${(d.source_organisation ?? "NULL").substring(0, 60)} | rule: ${d.rule_applied} | needs_review: ${d.needs_review}`);
        }
      }
    }

    // rule_applied breakdown for the just-patched docs
    const ruleBreakdown: Record<string, number> = {};
    for (const up of toProcess.map((doc) => classifyDocument(doc, now))) {
      const k = up.rule_applied;
      ruleBreakdown[k] = (ruleBreakdown[k] ?? 0) + 1;
    }
    console.log(`\n  --- rule_applied breakdown (this run) ---`);
    for (const [rule, cnt] of Object.entries(ruleBreakdown).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(cnt).padStart(3)}  ${rule}`);
    }
  }
}

main().catch(console.error);
