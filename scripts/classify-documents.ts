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
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SourceType = "GOVERNMENT" | "NGO" | "ACADEMIC" | "PRESS";
type SourceTier = "PRIMARY" | "SECONDARY";

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
]);

const GOVERNMENT_EXACT = new Set([
  "Commission for the Conservation of Antarctic Marine Living Resources (CCAMLR)",
  "CCAMLR (Commission for the Conservation of Antarctic Marine Living Resources)",
  "Indian Ocean Tuna Commission (IOTC)",
  "Indian Ocean Tuna Commission",
  "International Commission for the Conservation of Atlantic Tunas (ICCAT)",
  "Inter-American Tropical Tuna Commission (IATTC)",
  "Western and Central Pacific Fisheries Commission (WCPFC)",
  "General Fisheries Commission for the Mediterranean (GFCM)",
  "North East Atlantic Fisheries Commission (NEAFC)",
  "South Pacific Regional Fisheries Management Organisation",
  "Southern Indian Ocean Fisheries Agreement (SIOFA)",
  "Western Central Atlantic Fishery Commission (WECAFC)",
  "North Pacific Fisheries Commission",
  "International Seabed Authority",
  "International Whaling Commission",
  "ASCOBANS (Agreement on the Conservation of Small Cetaceans of the Baltic, North East Atlantic, Irish and North Seas)",
  "Conference of the Parties to the Convention on Biological Diversity",
  "European Commission",
  "Commission of the European Communities",
  "Council of the European Union",
  "European Parliament and Council of the European Union",
  "European Union",
  "Foyle, Carlingford and Irish Lights Commission",
]);

const ACADEMIC_EXACT = new Set([
  "ICES",
  "MBARI",
  "WHOI",
  "British Antarctic Survey",
  "Scripps",
]);

// ---------------------------------------------------------------------------
// GOVERNMENT KEYWORD PATTERNS
// Applied only after NGO_EXACT check (step c before step e).
// Returns matched pattern string, or null.
// NOTE: " authority" has a leading space — matches " authority" as a
// standalone word, not any org with "authority" as a substring fragment.
// ---------------------------------------------------------------------------

const GOV_STARTS: string[] = [
  "government of",
  "parliament of",
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

  // a. document_type = scientific_paper → ACADEMIC
  if (doc.document_type === "scientific_paper") {
    source_type = "ACADEMIC";
    rule_applied = "doctype:scientific_paper";
  }

  // b. URL domain allowlist
  if (!source_type && source_domain) {
    const t = classifyByDomain(source_domain);
    if (t) {
      source_type = t;
      rule_applied = `domain:${source_domain}`;
    }
  }

  // c. NGO exact match (before GOVERNMENT patterns)
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (NGO_EXACT.has(org)) {
      source_type = "NGO";
      rule_applied = `org:${org}`;
    }
  }

  // d. GOVERNMENT exact match
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (GOVERNMENT_EXACT.has(org)) {
      source_type = "GOVERNMENT";
      rule_applied = `org:${org}`;
    }
  }

  // e. GOVERNMENT keyword patterns
  if (!source_type && doc.source_organisation) {
    const pattern = matchGovernmentPattern(doc.source_organisation.trim());
    if (pattern) {
      source_type = "GOVERNMENT";
      rule_applied = pattern;
    }
  }

  // f. ACADEMIC exact match
  if (!source_type && doc.source_organisation) {
    const org = doc.source_organisation.trim();
    if (ACADEMIC_EXACT.has(org)) {
      source_type = "ACADEMIC";
      rule_applied = `org:${org}`;
    }
  }

  // g. No match
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
  console.log("Zero API calls — deterministic pass only.\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE env vars. Run via: npx tsx scripts/classify-documents.ts");
    process.exit(1);
  }

  // Paginate all approved documents
  const allDocs: DocRow[] = [];
  const PAGE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, is_primary_source, canonical_url, file_url, source_organisation, document_type, classified_at")
      .eq("status", "approved")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      return;
    }
    if (!data || data.length === 0) break;
    allDocs.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  console.log(`Total approved documents: ${allDocs.length}`);

  const toProcess = allDocs.filter((d) => !d.classified_at);
  const alreadyDone = allDocs.length - toProcess.length;
  if (alreadyDone > 0) console.log(`Already classified (skipping): ${alreadyDone}`);
  console.log(`To classify: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("All documents already classified.");
    return;
  }

  // Batch size for upsert — 100 rows per round trip
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

    // UPDATE (not upsert) — avoids NOT NULL constraint on title during insert path.
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
  console.log(`\n=== Complete ===`);
  console.log(`  Documents classified : ${done}`);
  console.log(`  GOVERNMENT           : ${counts.GOVERNMENT}`);
  console.log(`  NGO                  : ${counts.NGO}`);
  console.log(`  ACADEMIC             : ${counts.ACADEMIC}`);
  console.log(`  PRESS                : ${counts.PRESS}`);
  console.log(`  NULL (needs_review)  : ${counts.NULL}`);
  console.log(`  Elapsed              : ${totalSec}s`);
  console.log(`  API cost             : $0.00`);
}

main().catch(console.error);
