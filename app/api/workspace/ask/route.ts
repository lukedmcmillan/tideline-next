/**
 * /api/workspace/ask — In-project Ask panel
 *
 * Thin wrapper over the shared ask engine (app/lib/ask-engine.ts).
 * Accepts { question } in POST body, returns answer + sources.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmailFromSession } from "@/app/lib/auth";
import { askTideline } from "@/app/lib/ask-engine";

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 1000) {
    return NextResponse.json(
      { error: "question required (max 1000 chars)" },
      { status: 400 }
    );
  }

  try {
    const result = await askTideline(question);

    // Workspace surface returns the same shape as before for backwards compat
    return NextResponse.json({
      answer: result.answer ?? "I could not find any relevant documents in the Tideline library to answer this question. Try rephrasing your query or broadening the topic.",
      sources: result.sources,
      meta: result.meta,
      verification: result.verification,
    });
  } catch (err) {
    console.error("[workspace/ask] askTideline error:", err);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
