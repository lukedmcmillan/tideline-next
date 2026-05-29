// Quick probe: check published field format and test date filter
const BASE = "https://odata.informea.org/informea.svc";

async function main() {
  // 1. Fetch 1 CBD record — check field values
  const r1 = await fetch(`${BASE}/Decisions?$filter=treaty eq 'cbd'&$top=1&$expand=title,files&$format=json`,
    { headers: { "User-Agent": "Tideline/1.0" } });
  const d1 = await r1.json();
  const rec = d1?.d?.results?.[0];
  console.log("Sample record fields:");
  console.log("  published:", rec?.published);
  console.log("  updated  :", rec?.updated);
  console.log("  status   :", rec?.status);
  console.log("  title[0] :", rec?.title?.results?.[0]);

  // 2. Test date filter with OData v2 datetime format
  const since = "2025-01-01T00:00:00";
  const url2 = `${BASE}/Decisions?$filter=treaty eq 'cbd' and published gt datetime'${since}'&$top=5&$expand=title&$format=json`;
  console.log("\nTesting date filter:", url2);
  const r2 = await fetch(url2, { headers: { "User-Agent": "Tideline/1.0" } });
  const d2 = await r2.json();
  const count = d2?.d?.results?.length ?? 0;
  console.log(`  Results: ${count}`);
  if (count > 0) {
    d2.d.results.slice(0, 3).forEach((r: { published: string; status: string; title?: { results?: { language: string; value: string }[] } }) => {
      const en = r.title?.results?.find((t: { language: string }) => t.language === "en");
      console.log(`    [${r.published?.slice(0, 10)}] status=${r.status} | ${en?.value?.slice(0, 60)}`);
    });
  }

  // 3. Try without date filter to confirm API returns results at all
  const r3 = await fetch(`${BASE}/Decisions?$filter=treaty eq 'cites'&$top=3&$expand=title&$format=json`,
    { headers: { "User-Agent": "Tideline/1.0" } });
  const d3 = await r3.json();
  const count3 = d3?.d?.results?.length ?? 0;
  console.log(`\nCITES no date filter: ${count3} results`);
  if (count3 > 0) {
    d3.d.results.forEach((r: { published: string; status: string; number: string }) =>
      console.log(`  [${r.published?.slice(0, 10)}] status=${r.status} number=${r.number}`)
    );
  }
}
main().catch(console.error);
