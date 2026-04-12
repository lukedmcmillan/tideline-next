/* eslint-disable @typescript-eslint/no-require-imports */
const MULTIPLIER: Record<string, number> = {
  "imo-shipping": 0.75, "wto-fisheries": 0.75, isa: 0.75,
  bbnj: 0.46, plastics: 0.46, "30x30": 0.85, iuu: 0.85,
  "blue-finance": 0.80, "offshore-wind": 0.85, "cites-marine": 0.75,
};

async function run() {
  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing env vars"); process.exit(1); }
  const supabase = createClient(url, key);

  const { data: rows, error } = await supabase.from("velocity_scores").select("id, tracker_slug, score, score_volume, score_recency, score_signals");
  if (error) { console.error("Fetch error:", error.message); process.exit(1); }
  if (!rows || rows.length === 0) { console.log("No rows to backfill."); return; }

  let updated = 0;
  for (const row of rows) {
    const m = MULTIPLIER[row.tracker_slug] ?? 0.75;
    const adj = Math.round(row.score * m * 10) / 10;
    const sv = row.score_volume != null ? Math.round(row.score_volume * m * 10) / 10 : null;
    const sr = row.score_recency != null ? Math.round(row.score_recency * m * 10) / 10 : null;
    const ss = row.score_signals != null ? Math.round(row.score_signals * m * 10) / 10 : null;
    const { error: ue } = await supabase.from("velocity_scores").update({ score: adj, score_volume: sv, score_recency: sr, score_signals: ss }).eq("id", row.id);
    if (ue) console.error(`  ERR ${row.id}:`, ue.message);
    else { console.log(`  ${row.tracker_slug} ${row.score} -> ${adj}`); updated++; }
  }
  console.log(`Done. ${updated}/${rows.length} rows updated.`);
}

run();
