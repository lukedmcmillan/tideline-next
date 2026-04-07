import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const { data, error } = await supabase
    .from("isa_contractors")
    .select("id, company_name, sponsoring_state, contract_type, contract_area, contract_date, status, source_url, notes")
    .eq("status", "active")
    .order("contract_type", { ascending: true })
    .order("company_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contractors: data || [] });
}
