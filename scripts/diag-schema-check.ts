import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Test 1: Can we select category column?
  const { data: t1, error: e1 } = await supabase
    .from("delta_classifications")
    .select("story_id, category, governance_significance")
    .limit(1);
  console.log("Test 1 (category + gov_sig select):", e1 ? `ERROR: ${e1.message}` : `OK, row: ${JSON.stringify(t1)}`);

  // Test 2: Can we select classified_at?
  const { data: t2, error: e2 } = await supabase
    .from("delta_classifications")
    .select("story_id, classified_at")
    .limit(1);
  console.log("Test 2 (classified_at):", e2 ? `ERROR: ${e2.message}` : "OK");

  // Test 3: Can we select created_at?
  const { data: t3, error: e3 } = await supabase
    .from("delta_classifications")
    .select("story_id, created_at")
    .limit(1);
  console.log("Test 3 (created_at):", e3 ? `ERROR: ${e3.message}` : "OK");

  // Test 4: Try an insert with category column
  const testInsert = {
    story_id: "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e",
    prompt_version: "test-schema-check",
    is_delta: false,
    category: "GOVERNANCE_CHANGE",
    governance_significance: 85,
  };
  const { error: e4 } = await supabase
    .from("delta_classifications")
    .upsert(testInsert, { onConflict: "story_id,prompt_version", ignoreDuplicates: true });
  console.log("Test 4 (INSERT with category):", e4 ? `ERROR: ${e4.message}` : "OK — insert succeeded");

  // Clean up test row
  if (!e4) {
    await supabase.from("delta_classifications").delete()
      .eq("story_id", "d163bbdf-3bce-4a8b-bf0c-37adeaa6496e")
      .eq("prompt_version", "test-schema-check");
    console.log("Test row cleaned up");
  }

  // Total rows
  const { count } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true });
  console.log("Total rows:", count);

  // Sample a verb-era row to see all columns
  const { data: sample } = await supabase
    .from("delta_classifications")
    .select("*")
    .limit(1);
  if (sample && sample.length > 0) {
    console.log("Sample row columns:", Object.keys(sample[0]));
    console.log("Sample row:", JSON.stringify(sample[0]));
  }
}

main().catch(console.error);
