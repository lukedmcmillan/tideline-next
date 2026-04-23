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
  daily_counts: number[];    // 7 elements, index 0 = 6 days ago, index 6 = today
  daily_material: boolean[]; // 7 elements, true if any material mention
  is_tracked: boolean;
  tracked_since: string | null;
  latest_snippet: string | null; // short_summary of most recent story
}

// ── Shared: aggregate mentions for a set of entity IDs ──────────────────────
async function aggregateMentions(
  entityIds: string[],
  now: Date
): Promise<Map<string, Pick<EntityDashboardItem, "activity_30d" | "material_7d" | "last_seen" | "daily_counts" | "daily_material" | "latest_snippet">>> {
  const window30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const todayDay = Math.floor(now.getTime() / 86400000);
  const window7dMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const agg = new Map(
    entityIds.map(id => [id, {
      activity_30d: 0,
      material_7d: 0,
      last_seen: null as string | null,
      daily_counts: [0, 0, 0, 0, 0, 0, 0] as number[],
      daily_material: [false, false, false, false, false, false, false] as boolean[],
      latest_snippet: null as string | null,
    }])
  );

  if (entityIds.length === 0) return agg;

  const { data: mentions } = await supabase
    .from("entity_mentions")
    .select("entity_id, stories!inner(fetched_at, significance_score, short_summary)")
    .in("entity_id", entityIds)
    .gte("stories.fetched_at", window30d)
    .eq("stories.status", "live");

  for (const mention of mentions ?? []) {
    const story = mention.stories as unknown as {
      fetched_at: string;
      significance_score: number;
      short_summary: string | null;
    } | null;
    if (!story) continue;

    const row = agg.get(mention.entity_id);
    if (!row) continue;

    const fetchedMs = new Date(story.fetched_at).getTime();
    const fetchedDay = Math.floor(fetchedMs / 86400000);
    const daysAgo = todayDay - fetchedDay;

    row.activity_30d++;

    if (!row.last_seen || story.fetched_at > row.last_seen) {
      row.last_seen = story.fetched_at;
      row.latest_snippet = story.short_summary ?? null;
    }

    if (fetchedMs >= window7dMs && story.significance_score >= MATERIAL_THRESHOLD) {
      row.material_7d++;
    }

    if (daysAgo >= 0 && daysAgo < 7) {
      const idx = 6 - daysAgo;
      row.daily_counts[idx]++;
      if (story.significance_score >= MATERIAL_THRESHOLD) {
        row.daily_material[idx] = true;
      }
    }
  }

  return agg;
}

export async function GET(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = new URL(req.url).searchParams.get("scope") ?? "tracked";

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

  // 2. User's tracked entities (needed for both scopes)
  const { data: userEntities, error: ueErr } = await supabase
    .from("user_entities")
    .select("entity_id, added_at, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", userId);

  if (ueErr) return NextResponse.json({ error: ueErr.message }, { status: 500 });

  type EntityRow = { id: string; name: string; entity_type: string; tracker_tag: string | null };
  type UserEntityRow = { entity_id: string; added_at: string; entities: EntityRow | null };

  const trackedRows = (userEntities ?? []) as unknown as UserEntityRow[];
  const trackedMap = new Map<string, { entity: EntityRow; added_at: string }>(
    trackedRows
      .filter(r => r.entities !== null)
      .map(r => [r.entity_id, { entity: r.entities!, added_at: r.added_at }])
  );
  const trackedIds = [...trackedMap.keys()];

  const now = new Date();

  // ── SCOPE: tracked ─────────────────────────────────────────────────────────
  if (scope !== "all") {
    const { count: totalCount } = await supabase
      .from("entities")
      .select("id", { count: "exact", head: true });

    if (trackedIds.length === 0) {
      return NextResponse.json({
        entities: [],
        tier,
        tier_limit: tierLimit,
        total_entity_count: totalCount ?? 0,
      });
    }

    const aggMap = await aggregateMentions(trackedIds, now);

    const result: EntityDashboardItem[] = trackedIds.map(id => {
      const { entity, added_at } = trackedMap.get(id)!;
      const agg = aggMap.get(id)!;
      return {
        id: entity.id,
        name: entity.name,
        entity_type: entity.entity_type,
        tracker_tag: entity.tracker_tag,
        is_tracked: true,
        tracked_since: added_at ?? null,
        ...agg,
      };
    }).sort((a, b) => {
      if (b.material_7d !== a.material_7d) return b.material_7d - a.material_7d;
      return b.activity_30d - a.activity_30d;
    });

    return NextResponse.json({
      entities: result,
      tier,
      tier_limit: tierLimit,
      total_entity_count: totalCount ?? 0,
    });
  }

  // ── SCOPE: all ─────────────────────────────────────────────────────────────
  const { data: allEntities, count: totalCount, error: allErr } = await supabase
    .from("entities")
    .select("id, name, entity_type, tracker_tag", { count: "exact" })
    .order("mention_count", { ascending: false })
    .limit(500);

  if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });

  // Aggregate mentions only for the tracked subset (cheap: ~5-20 entities)
  const aggMap = await aggregateMentions(trackedIds, now);

  const result: EntityDashboardItem[] = (allEntities ?? []).map(e => {
    const isTracked = trackedMap.has(e.id);
    const agg = aggMap.get(e.id) ?? {
      activity_30d: 0,
      material_7d: 0,
      last_seen: null,
      daily_counts: [0, 0, 0, 0, 0, 0, 0],
      daily_material: [false, false, false, false, false, false, false],
      latest_snippet: null,
    };
    const trackedSince = isTracked ? (trackedMap.get(e.id)?.added_at ?? null) : null;
    return {
      id: e.id,
      name: e.name,
      entity_type: e.entity_type,
      tracker_tag: e.tracker_tag ?? null,
      is_tracked: isTracked,
      tracked_since: trackedSince,
      ...agg,
    };
  });

  return NextResponse.json({
    entities: result,
    tier,
    tier_limit: tierLimit,
    total_entity_count: totalCount ?? 0,
  });
}
