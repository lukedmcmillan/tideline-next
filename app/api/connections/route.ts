import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRACKER_LABELS: Record<string, string> = {
  isa: "ISA Mining",
  bbnj: "BBNJ Treaty",
  iuu: "IUU Fishing",
  "30x30": "30x30 MPAs",
  "blue-finance": "Blue Finance",
  plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping",
  "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine",
  "wto-fisheries": "WTO Fisheries",
};

export async function GET() {
  const { data, error } = await supabase
    .from("tracker_connections")
    .select("tracker_a, tracker_b, insight, generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ connection: null });
  }

  return NextResponse.json({
    connection: {
      trackers: [
        TRACKER_LABELS[data.tracker_a] || data.tracker_a,
        TRACKER_LABELS[data.tracker_b] || data.tracker_b,
      ],
      insight: data.insight,
      generated_at: data.generated_at,
    },
  });
}
