/**
 * One-shot seeder: ensure every active/trial subscriber has a row in
 * user_alert_preferences for every tracker slug, with alerts_enabled = true.
 *
 * Idempotent — uses upsert with onConflict (user_id, tracker_slug) and
 * ignoreDuplicates: true, so existing prefs (including ones a user has toggled
 * OFF) are preserved.
 *
 * Run:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/seed-alert-preferences.ts
 *   (or: npm run seed:alerts)
 */

import { createClient } from "@supabase/supabase-js";

const TRACKER_SLUGS = [
  "isa-deep-sea-mining",
  "bbnj-high-seas-treaty",
  "iuu-fishing",
  "30x30-mpa",
  "blue-finance-tnfd",
  "imo-shipping-emissions",
  "offshore-wind",
  "cites-marine",
  "wto-fisheries-subsidies",
  "plastics-treaty",
];

const ELIGIBLE_STATUSES = ["active", "trial"] as const;
const CHUNK_SIZE = 500;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE env vars. URL:", !!url, "KEY:", !!key);
    process.exit(1);
  }
  const supabase = createClient(url, key);

  console.log(`Fetching users with subscription_status in (${ELIGIBLE_STATUSES.join(", ")})...`);
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, email, subscription_status")
    .in("subscription_status", ELIGIBLE_STATUSES as unknown as string[]);

  if (userErr) {
    console.error("Failed to fetch users:", userErr.message);
    process.exit(1);
  }
  if (!users || users.length === 0) {
    console.log("No eligible users found. Nothing to seed.");
    return;
  }
  console.log(`Found ${users.length} eligible users.`);

  // Build payload: users × tracker slugs.
  const rows = users.flatMap(u =>
    TRACKER_SLUGS.map(slug => ({
      user_id: u.id as string,
      tracker_slug: slug,
      alerts_enabled: true,
    }))
  );
  console.log(`Building payload of ${rows.length} (user × tracker) rows.`);

  // Chunk and upsert.
  let attempted = 0;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    attempted += chunk.length;

    const { data, error } = await supabase
      .from("user_alert_preferences")
      .upsert(chunk, {
        onConflict: "user_id,tracker_slug",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      console.error(`Upsert chunk ${i}-${i + chunk.length} failed:`, error.message);
      process.exit(1);
    }
    inserted += data?.length ?? 0;
    console.log(`  chunk ${i}-${i + chunk.length - 1}: ${data?.length ?? 0} new rows`);
  }

  const skipped = attempted - inserted;
  console.log("");
  console.log("=== Done ===");
  console.log(`Eligible users:   ${users.length}`);
  console.log(`Tracker slugs:    ${TRACKER_SLUGS.length}`);
  console.log(`Rows attempted:   ${attempted}`);
  console.log(`Rows inserted:    ${inserted}`);
  console.log(`Rows skipped:     ${skipped} (already present, prefs preserved)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
