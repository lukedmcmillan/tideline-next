import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES } from "@/app/lib/tracker-metadata";

const ALL_SLUGS = Object.keys(DOMAIN_NAMES);

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Returns the tracker slugs a user has chosen to track.
 * If the user has no rows in user_topics, returns ALL 10 slugs
 * (default-all behaviour, zero breakage for existing subscribers).
 *
 * Every consumer that needs personalised filtering MUST call this
 * function. No consumer queries user_topics directly.
 */
export async function getUserTrackedDomains(userId: string): Promise<string[]> {
  const { data, error } = await admin()
    .from("user_topics")
    .select("tracker_slug")
    .eq("user_id", userId);

  if (error) {
    console.error("[user-preferences] query failed:", error.message);
    return ALL_SLUGS; // fail open: show everything
  }

  if (!data || data.length === 0) {
    return ALL_SLUGS; // no prefs set: default to all 10
  }

  return data.map(row => row.tracker_slug);
}

/**
 * Resolves a user_id from an email address via the users table.
 * Returns null if user not found.
 */
export async function userIdFromEmail(email: string): Promise<string | null> {
  const { data, error } = await admin()
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

/** The canonical list of all tracker slugs. */
export { ALL_SLUGS };
