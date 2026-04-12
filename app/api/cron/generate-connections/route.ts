import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const TRACKER_LABELS: Record<string, string> = {
  isa: "ISA Deep-Sea Mining",
  bbnj: "BBNJ High Seas Treaty",
  iuu: "IUU Fishing Enforcement",
  "30x30": "30x30 Marine Protected Areas",
  "blue-finance": "Blue Finance & ESG",
  plastics: "Plastics Treaty",
  "imo-shipping": "IMO Shipping Emissions",
  "offshore-wind": "Offshore Wind",
  "cites-marine": "CITES Marine Species",
  "wto-fisheries": "WTO Fisheries Subsidies",
};

const SYSTEM_PROMPT = `You are an ocean governance analyst flagging patterns for professionals to investigate. You observe — you do not conclude. Report what is happening across these two topics using only what the stories say. Name the specific events, dates, and actors. Do not say what caused what. End with: 'Worth watching together.' Keep it to 2-3 sentences maximum before the closing line.`;

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret") || request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Find stories with cross_tracker_flags from the last 48 hours
  const { data: recentStories, error: storiesErr } = await supabase
    .from("stories")
    .select("id, title, short_summary, cross_tracker_flags, published_at")
    .eq("status", "live")
    .not("cross_tracker_flags", "is", null)
    .gte("published_at", cutoff)
    .order("published_at", { ascending: false });

  if (storiesErr || !recentStories) {
    return NextResponse.json({ error: storiesErr?.message || "No stories" }, { status: 500 });
  }

  // Count stories per tracker
  const trackerStories: Record<string, typeof recentStories> = {};
  for (const story of recentStories) {
    const flags = story.cross_tracker_flags as string[];
    if (!Array.isArray(flags)) continue;
    for (const slug of flags) {
      if (!trackerStories[slug]) trackerStories[slug] = [];
      trackerStories[slug].push(story);
    }
  }

  // Find pairs where both trackers have stories
  const activeTrackers = Object.keys(trackerStories).filter(k => trackerStories[k].length > 0);
  const pairs: { a: string; b: string; count: number }[] = [];
  for (let i = 0; i < activeTrackers.length; i++) {
    for (let j = i + 1; j < activeTrackers.length; j++) {
      const a = activeTrackers[i];
      const b = activeTrackers[j];
      pairs.push({ a, b, count: trackerStories[a].length + trackerStories[b].length });
    }
  }

  // Sort by combined story count, take top 3
  pairs.sort((x, y) => y.count - x.count);
  const topPairs = pairs.slice(0, 3);

  if (topPairs.length === 0) {
    return NextResponse.json({ ok: true, connections: 0, reason: "No active tracker pairs in last 48h" });
  }

  let generated = 0;

  for (const pair of topPairs) {
    const storiesA = trackerStories[pair.a].slice(0, 3);
    const storiesB = trackerStories[pair.b].slice(0, 3);
    const labelA = TRACKER_LABELS[pair.a] || pair.a;
    const labelB = TRACKER_LABELS[pair.b] || pair.b;

    const userContent = `Topic A: ${labelA}\n${storiesA.map(s => `- ${s.title}${s.short_summary ? ` — ${s.short_summary}` : ""}`).join("\n")}\n\nTopic B: ${labelB}\n${storiesB.map(s => `- ${s.title}${s.short_summary ? ` — ${s.short_summary}` : ""}`).join("\n")}`;

    try {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      });

      const insight = msg.content[0].type === "text" ? msg.content[0].text : "";
      if (!insight || insight.length < 20) continue;

      await supabase.from("tracker_connections").insert({
        tracker_a: pair.a,
        tracker_b: pair.b,
        insight,
      });

      generated++;
    } catch (err) {
      console.error(`Connection generation failed for ${pair.a}/${pair.b}:`, err);
    }
  }

  return NextResponse.json({ ok: true, connections: generated, pairs: topPairs.length });
}
