import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ical, { ICalCalendarMethod } from "ical-generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Verify token
  const { data: subscription } = await supabase
    .from("calendar_subscriptions")
    .select("*")
    .eq("calendar_token", token)
    .single();

  if (!subscription) {
    return new Response("Calendar not found", { status: 404 });
  }

  const filters = (subscription.filters || {}) as {
    topics?: string[];
    bodies?: string[];
  };

  // Get upcoming events (next 12 months)
  let query = supabase
    .from("governance_events")
    .select("*, governance_bodies(name, abbreviation)")
    .gte("starts_at", new Date().toISOString())
    .lte(
      "starts_at",
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order("starts_at", { ascending: true });

  if (filters.topics && filters.topics.length > 0) {
    query = query.overlaps("topics", filters.topics);
  }

  const { data: events } = await query;

  // Filter by body abbreviation client-side (Supabase can't filter on joined table easily)
  let filtered = events || [];
  if (filters.bodies && filters.bodies.length > 0) {
    filtered = filtered.filter((e: any) =>
      filters.bodies!.includes(e.governance_bodies?.abbreviation)
    );
  }

  // Generate iCal
  const calendar = ical({
    name: "Tideline — Ocean Governance Calendar",
    description:
      "Professional ocean governance meetings, deadlines, and decisions",
    method: ICalCalendarMethod.PUBLISH,
    prodId: { company: "Tideline", product: "Ocean Governance Calendar" },
    timezone: "UTC",
  });

  for (const event of filtered) {
    const body = event.governance_bodies as any;
    const abbr = body?.abbreviation || "";

    calendar.createEvent({
      id: event.id,
      start: new Date(event.starts_at),
      end: event.ends_at
        ? new Date(event.ends_at)
        : new Date(new Date(event.starts_at).getTime() + 24 * 60 * 60 * 1000),
      summary: `[${abbr}] ${event.title}`,
      description: [
        event.description || "",
        event.significance_reason
          ? `\nWhy it matters: ${event.significance_reason}`
          : "",
        event.agenda_url ? `\nAgenda: ${event.agenda_url}` : "",
        `\nSignificance: ${event.significance || "routine"}`,
        `\nhttps://www.thetideline.co/tracker/governance/${event.id}`,
      ]
        .filter(Boolean)
        .join(""),
      location: event.is_virtual ? "Virtual" : event.location || "TBC",
      url: `https://www.thetideline.co/tracker/governance/${event.id}`,
    });
  }

  // Update last_accessed
  await supabase
    .from("calendar_subscriptions")
    .update({ last_accessed: new Date().toISOString() })
    .eq("calendar_token", token);

  return new Response(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="tideline-ocean-governance.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
