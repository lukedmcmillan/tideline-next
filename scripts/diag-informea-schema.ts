import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Check documents table columns via a sample row
  const { data: sample, error } = await s.from("documents").select("*").limit(1);
  if (error) { console.log("documents error:", error.message); return; }
  if (sample?.[0]) {
    console.log("documents columns:", Object.keys(sample[0]).join(", "));
    console.log("\nSample row:");
    for (const [k, v] of Object.entries(sample[0])) {
      const val = typeof v === 'string' ? v.slice(0, 80) : JSON.stringify(v)?.slice(0, 80);
      console.log(`  ${k}: ${val}`);
    }
  }

  // Also check document_queue columns
  const { data: qSample } = await s.from("document_queue").select("*").limit(1);
  if (qSample?.[0]) {
    console.log("\ndocument_queue columns:", Object.keys(qSample[0]).join(", "));
  }
}
main().catch(console.error);
