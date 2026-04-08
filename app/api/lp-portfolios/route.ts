import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_RELATIONSHIPS = new Set([
  "portfolio_company",
  "competitor",
  "regulator",
  "partner",
]);

async function requireCorporate(req: NextRequest) {
  const email = await getEmailFromSession(req);
  console.log("[lp-portfolios] session email:", email);
  if (!email) return { error: "Unauthorized", status: 401 as const };

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("tier")
    .eq("email", email)
    .single();

  console.log("[lp-portfolios] db lookup:", { email, tier: user?.tier, userError: userError?.message });

  if (!user || user.tier !== "corporate") {
    return { error: "Corporate tier required", status: 403 as const };
  }
  return { email };
}

export async function GET(req: NextRequest) {
  const gate = await requireCorporate(req);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const fundName = new URL(req.url).searchParams.get("fund_name");
  if (!fundName) return NextResponse.json({ error: "fund_name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("lp_portfolios")
    .select("id, fund_name, entity_id, relationship, notes, active, briefing_type, entities(id, name, entity_type, mention_count)")
    .eq("fund_name", fundName)
    .eq("active", true)
    .order("relationship", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ portfolio: data || [] });
}

export async function POST(req: NextRequest) {
  const gate = await requireCorporate(req);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json();
  const { fund_name, entity_id, relationship, notes, briefing_type } = body;

  if (!fund_name || !entity_id || !relationship) {
    return NextResponse.json({ error: "fund_name, entity_id, relationship required" }, { status: 400 });
  }
  if (!VALID_RELATIONSHIPS.has(relationship)) {
    return NextResponse.json({ error: "Invalid relationship" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lp_portfolios")
    .upsert(
      {
        fund_name,
        entity_id,
        relationship,
        notes: notes || null,
        active: true,
        briefing_type: briefing_type || "standard",
      },
      { onConflict: "fund_name,entity_id" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireCorporate(req);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("lp_portfolios").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
