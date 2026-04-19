import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/onboarding/entity-match
 * Fuzzy match free-text input against entities + aliases via pg_trgm.
 * Returns top 2 matches above 0.4 similarity threshold.
 * Client shows "Did you mean: [X] [Y]? Or add as new entity."
 */
export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { query } = await req.json();

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  const trimmed = query.trim();

  // Search entities by name similarity
  const { data: nameMatches } = await supabase.rpc("match_entities_by_name", {
    search_text: trimmed,
    match_threshold: 0.4,
    match_limit: 2,
  });

  // Search aliases by similarity
  const { data: aliasMatches } = await supabase.rpc("match_entities_by_alias", {
    search_text: trimmed,
    match_threshold: 0.4,
    match_limit: 2,
  });

  // Merge and deduplicate by entity ID, keep highest similarity
  const seen = new Map<string, { id: string; name: string; entity_type: string; similarity: number }>();

  for (const m of [...(nameMatches || []), ...(aliasMatches || [])]) {
    const existing = seen.get(m.id);
    if (!existing || m.similarity > existing.similarity) {
      seen.set(m.id, {
        id: m.id,
        name: m.name,
        entity_type: m.entity_type,
        similarity: m.similarity,
      });
    }
  }

  // Sort by similarity descending, take top 2
  const matches = Array.from(seen.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2);

  return NextResponse.json({ query: trimmed, matches });
}
