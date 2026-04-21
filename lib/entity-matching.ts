import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/app/lib/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_MATCHES_PER_STORY = 8;
const FUZZY_THRESHOLD = 0.8;
const SEMANTIC_THRESHOLD = 0.75;

interface MatchResult {
  matched: number;
  method: string[];
  entityIds: string[];
}

interface EntityMatch {
  entityId: string;
  entityName: string;
  matchScore: number;
  matchMethod: "exact" | "fuzzy" | "semantic";
  confidence: number;
}

/**
 * Matches a story against the entities table using a three-pass approach:
 *
 * Pass 1: Exact substring match (ILIKE) — fast, high precision
 * Pass 2: Fuzzy alias match (pg_trgm on title vs each alias) — catches variations
 * Pass 3: Semantic embedding match (pgvector cosine) — future use when embeddings populated
 */
export async function matchEntitiesToStory(
  storyId: string,
  options?: { dryRun?: boolean }
): Promise<MatchResult> {
  const dryRun = options?.dryRun ?? false;

  // Fetch story
  const { data: story, error: storyErr } = await supabase
    .from("stories")
    .select("id, title, short_summary")
    .eq("id", storyId)
    .single();

  if (storyErr || !story) {
    console.log(`[entity-match] story not found: ${storyId}`);
    return { matched: 0, method: [], entityIds: [] };
  }

  const title = story.title || "";
  const summary = story.short_summary || "";
  const allMatches: EntityMatch[] = [];
  const methods: Set<string> = new Set();

  // ─── Pass 1: Exact substring match via RPC ────────────────────────────────
  // Single query: joins entities + entity_aliases, checks ILIKE substring
  // with word-boundary handling for short aliases (< 4 chars)

  const { data: exactHits, error: exactErr } = await supabase.rpc(
    "match_entities_in_text",
    {
      story_title: title,
      story_summary: summary,
    }
  );

  if (!exactErr && exactHits) {
    for (const row of exactHits) {
      allMatches.push({
        entityId: row.entity_id,
        entityName: row.entity_name,
        matchScore: 1.0,
        matchMethod: "exact",
        confidence: 0.95,
      });
    }
    if (exactHits.length > 0) methods.add("exact");
  }

  // ─── Pass 2: Fuzzy alias match (pg_trgm on title vs alias) ────────────────
  // Only for entities NOT matched in Pass 1.
  // Compares each alias against the story title using trigram similarity.
  // Lower threshold (0.7) because we compare similarly-sized strings.

  if (allMatches.length < MAX_MATCHES_PER_STORY) {
    const matchedIds = new Set(allMatches.map((m) => m.entityId));

    // Fetch entities with aliases that weren't matched in Pass 1
    // Use a single query that gets all entities + aliases
    const { data: allEntities } = await supabase
      .from("entities")
      .select("id, name, entity_type, entity_aliases(alias_text)");

    if (allEntities) {
      const titleLower = title.toLowerCase();

      // Exclude government entities from fuzzy — they should only match via exact (Pass 1)
      const fuzzyEntities = allEntities.filter(
        (e) => !(e.entity_type === "organisation" && e.name.toLowerCase().includes("government"))
      );

      for (const entity of fuzzyEntities) {
        if (matchedIds.has(entity.id)) continue;

        // Collect candidate texts for this entity
        const candidates: string[] = [];
        if (entity.name.length >= 4) candidates.push(entity.name);
        const aliases = (entity as { entity_aliases?: { alias_text: string }[] }).entity_aliases;
        if (aliases) {
          for (const a of aliases) {
            if (a.alias_text.length >= 4) candidates.push(a.alias_text);
          }
        }

        // Check each candidate against title using trigram similarity
        for (const text of candidates) {
          const sim = trigramSimilarity(text.toLowerCase(), titleLower);
          if (sim >= FUZZY_THRESHOLD) {
            allMatches.push({
              entityId: entity.id,
              entityName: entity.name,
              matchScore: sim,
              matchMethod: "fuzzy",
              confidence: 0.75,
            });
            matchedIds.add(entity.id);
            methods.add("fuzzy");
            break; // One match per entity is enough
          }
        }

        // Stop if we've hit the cap
        if (allMatches.length >= MAX_MATCHES_PER_STORY) break;
      }
    }
  }

  // ─── Pass 3: Semantic embedding match (only if < 3 matches, embeddings exist) ─

  if (allMatches.length < 3) {
    try {
      const searchText = summary ? `${title} ${summary}` : title;
      const embedding = await generateEmbedding(searchText.slice(0, 1000));

      const { data: semanticHits, error: semErr } = await supabase.rpc(
        "match_entity_embeddings",
        {
          query_embedding: embedding,
          match_threshold: SEMANTIC_THRESHOLD,
          match_count: 10,
        }
      );

      if (!semErr && semanticHits) {
        const matchedIds = new Set(allMatches.map((m) => m.entityId));

        for (const row of semanticHits) {
          if (matchedIds.has(row.id)) continue;

          allMatches.push({
            entityId: row.id,
            entityName: row.name,
            matchScore: row.similarity,
            matchMethod: "semantic",
            confidence: 0.75,
          });
        }

        if (semanticHits.length > 0) methods.add("semantic");
      }
    } catch (err) {
      console.log(
        `[entity-match] embedding failed for ${storyId}: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  // ─── Cap at MAX_MATCHES_PER_STORY, ranked by confidence then score ────────

  allMatches.sort((a, b) => b.confidence - a.confidence || b.matchScore - a.matchScore);
  const finalMatches = allMatches.slice(0, MAX_MATCHES_PER_STORY);

  if (finalMatches.length === 0) {
    console.log(
      `[entity-match] no matches: ${storyId} "${title.slice(0, 50)}"`
    );
    return { matched: 0, method: [], entityIds: [] };
  }

  // ─── Write to entity_mentions (with upsert) ───────────────────────────────

  if (!dryRun) {
    for (const match of finalMatches) {
      await supabase
        .from("entity_mentions")
        .upsert(
          {
            entity_id: match.entityId,
            story_id: storyId,
            match_score: match.matchScore,
            match_method: match.matchMethod,
            confidence: match.confidence,
            mentioned_at: new Date().toISOString(),
          },
          {
            onConflict: "entity_id,story_id",
            ignoreDuplicates: false,
          }
        );

      await supabase.rpc("increment_entity_count", {
        entity_id: match.entityId,
      });
    }
  }

  const entityIds = finalMatches.map((m) => m.entityId);
  const methodArr = [...methods];

  console.log(
    `[entity-match] ${storyId} "${title.slice(0, 50)}" → ${finalMatches.length} matches [${methodArr.join(",")}]`
  );

  return { matched: finalMatches.length, method: methodArr, entityIds };
}

/**
 * Batch process: match entities for multiple stories.
 */
export async function matchEntitiesBatch(
  storyIds: string[],
  options?: { dryRun?: boolean }
): Promise<{
  processed: number;
  totalMatches: number;
  avgMatchesPerStory: number;
}> {
  let totalMatches = 0;

  for (const storyId of storyIds) {
    const result = await matchEntitiesToStory(storyId, options);
    totalMatches += result.matched;
  }

  const avg =
    storyIds.length > 0 ? Math.round((totalMatches / storyIds.length) * 10) / 10 : 0;

  console.log(
    `[entity-match:batch] processed=${storyIds.length} matches=${totalMatches} avg=${avg}`
  );

  return {
    processed: storyIds.length,
    totalMatches,
    avgMatchesPerStory: avg,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Client-side trigram similarity between a short candidate string
 * and a longer text (title). Checks if the candidate appears as a
 * fuzzy match within any segment of the title.
 *
 * Returns a score 0-1 representing how closely the candidate matches
 * a window of the title text.
 */
function trigramSimilarity(candidate: string, text: string): number {
  if (candidate.length < 3) return 0;

  // Generate trigrams for candidate
  const candidateTrigrams = new Set<string>();
  for (let i = 0; i <= candidate.length - 3; i++) {
    candidateTrigrams.add(candidate.slice(i, i + 3));
  }

  // Slide a window of candidate.length (+/- 2 chars) across the text
  // and find the best trigram overlap
  let bestSim = 0;
  const windowMin = Math.max(3, candidate.length - 2);
  const windowMax = candidate.length + 2;

  for (let winSize = windowMin; winSize <= windowMax; winSize++) {
    for (let i = 0; i <= text.length - winSize; i++) {
      const window = text.slice(i, i + winSize);
      const windowTrigrams = new Set<string>();
      for (let j = 0; j <= window.length - 3; j++) {
        windowTrigrams.add(window.slice(j, j + 3));
      }

      // Jaccard-like similarity
      let intersection = 0;
      for (const t of candidateTrigrams) {
        if (windowTrigrams.has(t)) intersection++;
      }

      const union = candidateTrigrams.size + windowTrigrams.size - intersection;
      const sim = union > 0 ? intersection / union : 0;

      if (sim > bestSim) bestSim = sim;
      if (bestSim >= 0.9) return bestSim; // Early exit on strong match
    }
  }

  return bestSim;
}
