import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fetchAll<T>(select: string): Promise<T[]> {
  const all: T[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from("documents")
      .select(select)
      .eq("status", "approved")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) { console.error(error.message); break; }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function run() {
  // Q1: source_type distribution
  const q1 = await fetchAll<{source_type: string | null}>("source_type");
  const t1: Record<string,number> = {};
  for (const r of q1) { const k = r.source_type ?? "NULL"; t1[k] = (t1[k]||0)+1; }
  console.log(`=== Q1: source_type distribution (total ${q1.length}) ===`);
  for (const [k,v] of Object.entries(t1).sort((a,b)=>b[1]-a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);

  // Q2: source_tier distribution
  const q2 = await fetchAll<{source_tier: string | null}>("source_tier");
  const t2: Record<string,number> = {};
  for (const r of q2) { const k = r.source_tier ?? "NULL"; t2[k] = (t2[k]||0)+1; }
  console.log(`\n=== Q2: source_tier distribution (total ${q2.length}) ===`);
  for (const [k,v] of Object.entries(t2).sort((a,b)=>b[1]-a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);

  // Q3: classified_at coverage
  const { count: c3 } = await sb.from("documents").select("id",{count:"exact",head:true}).eq("status","approved").is("classified_at",null);
  console.log(`\n=== Q3: classified_at NULL count === ${c3}`);

  // Q4: needs_review count
  const { count: c4 } = await sb.from("documents").select("id",{count:"exact",head:true}).eq("status","approved").eq("needs_review",true);
  console.log(`=== Q4: needs_review=true count === ${c4}`);

  // Q5: rule_applied breakdown
  const q5 = await fetchAll<{rule_applied: string | null}>("rule_applied");
  const t5: Record<string,number> = {};
  for (const r of q5) { const k = r.rule_applied ?? "(null)"; t5[k] = (t5[k]||0)+1; }
  console.log(`\n=== Q5: rule_applied breakdown (top 30 of ${q5.length}) ===`);
  for (const [k,v] of Object.entries(t5).sort((a,b)=>b[1]-a[1]).slice(0,30)) console.log(`  ${String(v).padStart(5)}  ${k}`);
}
run().catch(console.error);
