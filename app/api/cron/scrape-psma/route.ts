import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const res = await fetch("https://www.fao.org/port-state-measures/background/parties-psma/en/", {
      headers: { "User-Agent": "Tideline/1.0 (ocean intelligence)" },
    });
    const html = await res.text();

    // Try regex for "NN parties" or "NN Parties"
    const match = html.match(/(\d+)\s+part(?:y|ies)/i);
    // Fallback: count <tr> rows in the table
    const trCount = (html.match(/<tr[\s>]/gi) || []).length;

    const count = match ? parseInt(match[1], 10) : trCount > 5 ? trCount - 1 : 0;

    if (count === 0) {
      console.error("PSMA scrape: could not extract party count");
      return NextResponse.json({ ok: false, error: "Could not extract count" });
    }

    await supabase.from("psma_stats").insert({ party_count: count });

    return NextResponse.json({ ok: true, party_count: count });
  } catch (err) {
    console.error("PSMA scrape error:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
