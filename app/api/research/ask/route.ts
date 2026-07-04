/**
 * /api/research/ask — Full-screen research console
 *
 * Powered by the shared ask engine (app/lib/ask-engine.ts).
 * Returns the ask answer + a parallel deterministic library search
 * so the UI can show matching documents even when the answer abstains.
 *
 * HISTORY: This route originally used lib/research.ts with a divergent
 * retrieval path (single-strategy, PRIMARY-only default, no re-scoring).
 * That path produced wrong-subject answers on acronym queries (BBNJ
 * returning MARPOL). Unified onto the working workspace engine
 * 2026-07-04. lib/research.ts retained for its trust mechanisms
 * (citation verification, faithfulness check) which are now ported
 * into ask-engine.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { askTideline } from "@/app/lib/ask-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query =
    typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 500) {
    return NextResponse.json(
      { error: "query required (max 500 chars)" },
      { status: 400 }
    );
  }

  try {
    // Run ask engine and library search in parallel
    // DELIBERATE DECISION (2026-07-04): faithfulness check OFF on research
    // surface for latency. Citation verification (deterministic, zero-cost)
    // still runs — strips sentences citing non-existent sources.
    //
    // Faithfulness check (Haiku per-claim "does the source actually say this?")
    // adds 3-5s latency. For an interactive search console, that's too slow.
    // Workspace/ask retains the full check for in-project deep research.
    //
    // Phase 2 approach: async verify-after-answer. Return citation-verified
    // answer immediately, fire Haiku faithfulness as background task, write
    // result to research_queries.faithfulness_status. Frontend polls via
    // GET /api/research/verify?queryId=X and transitions a badge from
    // "Checking..." to "Verified" once complete. Gives speed AND trust signal.
    //
    // Trigger for Phase 2: paid conversion, not a support request. The current
    // surface makes no verification claim it can't back — UI copy says only
    // "N passages" and "N invalid citations removed", never "claims verified".
    const [askResult, libraryResult] = await Promise.all([
      askTideline(query, { skipFaithfulness: true }),
      searchLibrary(query),
    ]);

    return NextResponse.json({
      // Ask answer
      answer: askResult.answer,
      abstained: askResult.abstained,
      abstentionReason: askResult.abstentionReason,
      sources: askResult.sources,
      verification: askResult.verification,
      meta: askResult.meta,
      // Library search results (deterministic, always returned)
      searchResults: libraryResult.documents,
      totalDocuments: libraryResult.totalCount,
    });
  } catch (err) {
    console.error("[research/ask] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}

// ─── Deterministic library search (parallel with ask) ────────────────────────

async function searchLibrary(
  query: string
): Promise<{ documents: LibraryDoc[]; totalCount: number }> {
  // Text search over approved documents
  let q = supabase
    .from("documents")
    .select("id, title, source_organisation, document_type, source_tier, published_date, created_at")
    .eq("status", "approved");

  if (query.length > 0) {
    q = q.or(`title.ilike.%${query}%,source_organisation.ilike.%${query}%`);
  }

  q = q.order("created_at", { ascending: false }).limit(20);

  const { data, error } = await q;

  if (error) {
    console.error("[research/ask] library search error:", error);
    return { documents: [], totalCount: 0 };
  }

  // Total approved document count (real number, not hardcoded)
  const { count: totalCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return {
    documents: (data || []).map((d) => ({
      id: d.id,
      title: d.title,
      source_organisation: d.source_organisation,
      document_type: d.document_type,
      source_tier: d.source_tier,
      published_date: d.published_date,
      created_at: d.created_at,
    })),
    totalCount: totalCount || 0,
  };
}

interface LibraryDoc {
  id: string;
  title: string;
  source_organisation: string | null;
  document_type: string | null;
  source_tier: string | null;
  published_date: string | null;
  created_at: string;
}
