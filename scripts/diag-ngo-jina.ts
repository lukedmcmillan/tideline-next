import { config } from "dotenv";
config({ path: ".env.local" });

const JINA_KEY = process.env.JINA_API_KEY || "";

const SOURCES = [
  { slug: "oceancare", url: "https://www.oceancare.org/en/stories-and-news/" },
  { slug: "iucn",      url: "https://www.iucn.org/resources/issues-briefs" },
  { slug: "oceana",    url: "https://oceana.org/reports/" },
];

async function fetchJina(url: string): Promise<string | null> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Authorization: `Bearer ${JINA_KEY}`,
      Accept: "text/plain",
      "X-Return-Format": "markdown",
      "X-Timeout": "15",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) { console.log(`  FETCH FAILED: HTTP ${res.status}`); return null; }
  return res.text();
}

async function main() {
  for (const src of SOURCES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`[${src.slug}] ${src.url}`);
    console.log("=".repeat(60));

    const md = await fetchJina(src.url);
    if (!md) continue;
    console.log(`Total chars: ${md.length}`);

    // Pattern A: markdown [text](url) — first 5
    console.log("\n--- Pattern A: [text](url) links (first 5) ---");
    const mdRe = /\[([^\]]{1,200})\]\((https?:[^)]+)\)/g;
    let m;
    let count = 0;
    while ((m = mdRe.exec(md)) !== null && count < 5) {
      console.log(`  [${m[1].trim().slice(0, 70)}](${m[2].slice(0, 100)})`);
      count++;
    }
    if (count === 0) console.log("  NONE");

    // Pattern B: bare PDF URLs not wrapped in markdown syntax
    console.log("\n--- Pattern B: bare *.pdf URLs (first 5) ---");
    const bareRe = /(?<!\]\()https?:\/\/[^\s)"'<>]+\.pdf[^\s)"'<>]*/gi;
    const barePdfs: string[] = [];
    while ((m = bareRe.exec(md)) !== null && barePdfs.length < 5) {
      barePdfs.push(m[0].slice(0, 120));
    }
    if (barePdfs.length === 0) console.log("  NONE");
    else barePdfs.forEach(u => console.log(`  ${u}`));

    // Pattern B2: short link text (<10 chars) wrapping any URL
    console.log("\n--- Pattern B2: short-text (<10 chars) links — first 5 ---");
    const shortRe = /\[([^\]]{1,9})\]\((https?:[^)]+)\)/g;
    const shorts: string[] = [];
    while ((m = shortRe.exec(md)) !== null && shorts.length < 5) {
      shorts.push(`[${m[1]}](${m[2].slice(0, 80)})`);
    }
    if (shorts.length === 0) console.log("  NONE");
    else shorts.forEach(l => console.log(`  ${l}`));

    // Pattern C: JSON-LD structured data
    console.log("\n--- Pattern C: JSON-LD / structured data ---");
    const hasJsonLd = md.includes('"@context"') || md.includes("application/ld+json");
    console.log(`  JSON-LD present: ${hasJsonLd}`);

    // Pattern D: context window around report/pdf URLs
    console.log("\n--- Pattern D: context around report/pdf URLs (first 3) ---");
    const ctxRe = /https?:\/\/[^\s)"'<>]+(?:report|publication|brief|paper|\.pdf)[^\s)"'<>]*/gi;
    const ctxMatches: string[] = [];
    while ((m = ctxRe.exec(md)) !== null && ctxMatches.length < 3) {
      const start = Math.max(0, m.index - 80);
      const end   = Math.min(md.length, m.index + m[0].length + 80);
      ctxMatches.push(md.slice(start, end).replace(/\n/g, " ").slice(0, 240));
    }
    if (ctxMatches.length === 0) console.log("  NONE");
    else ctxMatches.forEach((c, i) => console.log(`  [${i + 1}] ...${c}...`));
  }
}

main().catch(console.error);
