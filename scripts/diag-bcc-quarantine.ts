/**
 * Check quarantine table + raw RSS fetch for new carbon-market sources.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/diag-bcc-quarantine.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SOURCES_TO_CHECK = [
  { name: "Verra", rss: "https://verra.org/feed/" },
  { name: "ICVCM", rss: "https://icvcm.org/feed/" },
  { name: "VCMI", rss: "https://vcmintegrity.org/feed/" },
  { name: "Ecosystem Marketplace", rss: "https://www.ecosystemmarketplace.com/feed/" },
];

async function fetchFeedTitles(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Tideline/1.0 RSS Reader" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [`HTTP ${res.status}`];
    const xml = await res.text();
    const titles: string[] = [];
    const regex = /<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(xml)) !== null && count < 8) {
      const t = match[1].trim();
      if (t && !titles.includes(t)) { titles.push(t); count++; }
    }
    // Remove first item (usually feed title = source name)
    if (titles.length > 0 && titles[0] === titles[1]) titles.splice(0, 1);
    return titles.slice(0, 6);
  } catch (e: unknown) {
    return [`FETCH_ERROR: ${e instanceof Error ? e.message : String(e)}`];
  }
}

async function main() {
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // ── 1. Quarantine counts by source ────────────────────────────────────────
  const { data: quarantine } = await supabase
    .from("stories_quarantine")
    .select("source_name, title, haiku_verdict, created_at")
    .gte("created_at", since48h)
    .order("created_at", { ascending: false })
    .limit(50);

  const bySource: Record<string, number> = {};
  for (const row of quarantine || []) {
    bySource[row.source_name] = (bySource[row.source_name] || 0) + 1;
  }

  console.log("\n── (1) Quarantine: counts last 48h by source ─────────────────────");
  const sorted = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    console.log("  Quarantine table empty for last 48h.");
  } else {
    for (const [src, cnt] of sorted) {
      const marker = SOURCES_TO_CHECK.some(s => s.name === src) ? " ← NEW" : "";
      console.log(`  ${src.padEnd(30)} ${cnt}${marker}`);
    }
  }

  // ── 2. Quarantine: show items from new sources ─────────────────────────────
  const targetNames = SOURCES_TO_CHECK.map(s => s.name);
  const relevant = (quarantine || []).filter(r => targetNames.includes(r.source_name));
  console.log(`\n── (2) Quarantined items from new carbon-market sources ──────────`);
  if (relevant.length === 0) {
    console.log("  None in quarantine — these sources returned 0 parseable items from RSS.");
    console.log("  This means parseRSSFeed is returning [] (network block, Cloudflare, or parse issue).");
  } else {
    for (const r of relevant) {
      console.log(`  [${r.source_name}] ${(r.title || "").slice(0, 80)}`);
      console.log(`    verdict: ${r.haiku_verdict}  at: ${r.created_at?.slice(0, 16)}`);
    }
  }

  // ── 3. Direct RSS fetch — confirm what Vercel cron would see ──────────────
  console.log(`\n── (3) Direct RSS fetch — item titles each source currently serves ─`);
  for (const src of SOURCES_TO_CHECK) {
    const titles = await fetchFeedTitles(src.rss);
    console.log(`\n  ${src.name} (${src.rss}):`);
    for (const t of titles) {
      console.log(`    · ${t}`);
    }
  }

  console.log("");
}

main().catch(console.error);
