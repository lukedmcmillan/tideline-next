import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailFromSession } from "@/app/lib/auth";
import { MATERIAL_THRESHOLD } from "@/app/lib/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIER_LIMITS: Record<string, number | null> = {
  free: 10,
  individual: 50,
  team: 100,
  enterprise: null,
};

export interface EntityDashboardItem {
  id: string;
  name: string;
  entity_type: string;
  tracker_tag: string | null;
  activity_30d: number;
  material_7d: number;
  last_seen: string | null;
  daily_counts: number[];   // 7 elements, index 0 = 6 days ago, index 6 = today
  daily_material: boolean[]; // 7 elements, true if any material mention (sig >= MATERIAL_THRESHOLD)
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. User id + tier
  const { data: userRow } = await supabase
    .from("users")
    .select("id, tier")
    .eq("email", email)
    .single();

  if (!userRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId: string = userRow.id;
  const tier: string = userRow.tier || "free";
  const tierLimit: number | null = Object.prototype.hasOwnProperty.call(TIER_LIMITS, tier)
    ? TIER_LIMITS[tier]
    : 10;

  // 2. Tracked entities
  const { data: userEntities, error: ueErr } = await supabase
    .from("user_entities")
    .select("entity_id, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", userId);

  if (ueErr) return NextResponse.json({ error: ueErr.message }, { status: 500 });

  type EntityRow = { id: string; name: string; entity_type: string; tracker_tag: string | null };
  const entities: EntityRow[] = (userEntities ?? [])
    .map(ue => ue.entities as unknown as EntityRow | null)
    .filter((e): e is EntityRow => e !== null);

  const entityIds = entities.map(e => e.id);

  if (entityIds.length === 0) {
    return NextResponse.json({ entities: [], tier, tier_limit: tierLimit });
  }

  // 3. Entity mentions — last 30 days
  const now = new Date();
  const window30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayDay = Math.floor(now.getTime() / 86400000);
  const window7dMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const { data: mentions } = await supabase
    .from("entity_mentions")
    .select("entity_id, stories!inner(fetched_at, significance_score)")
    .in("entity_id", entityIds)
    .gte("stories.fetched_at", window30d)
    .eq("stories.status", "live");

  // 4. Aggregate per entity
  const agg = new Map<string, EntityDashboardItem>(
    entities.map(e => [e.id, {
      id: e.id,
      name: e.name,
      entity_type: e.entity_type,
      tracker_tag: e.tracker_tag,
      activity_30d: 0,
      material_7d: 0,
      last_seen: null,
      daily_counts: [0, 0, 0, 0, 0, 0, 0],
      daily_material: [false, false, false, false, false, false, false],
    }])
  );

  for (const mention of mentions ?? []) {
    const story = mention.stories as unknown as {
      fetched_at: string;
      significance_score: number;
    } | null;
    if (!story) continue;

    const row = agg.get(mention.entity_id);
    if (!row) continue;

    const fetchedMs = new Date(story.fetched_at).getTime();
    const fetchedDay = Math.floor(fetchedMs / 86400000);
    const daysAgo = todayDay - fetchedDay; // 0 = today, 1 = yesterday

    row.activity_30d++;

    if (!row.last_seen || story.fetched_at > row.last_seen) {
      row.last_seen = story.fetched_at;
    }

    if (fetchedMs >= window7dMs && story.significance_score >= MATERIAL_THRESHOLD) {
      row.material_7d++;
    }

    // Sparkline bucket: index 0 = 6 days ago, index 6 = today
    if (daysAgo >= 0 && daysAgo < 7) {
      const idx = 6 - daysAgo;
      row.daily_counts[idx]++;
      if (story.significance_score >= MATERIAL_THRESHOLD) {
        row.daily_material[idx] = true;
      }
    }
  }

  // 5. Sort: material_7d DESC, activity_30d DESC
  const result = [...agg.values()].sort((a, b) => {
    if (b.material_7d !== a.material_7d) return b.material_7d - a.material_7d;
    return b.activity_30d - a.activity_30d;
  });

  return NextResponse.json({ entities: result, tier, tier_limit: tierLimit });
}
