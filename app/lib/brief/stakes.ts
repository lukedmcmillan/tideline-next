// app/lib/brief/stakes.ts
// Per-stakeholder-type stakes sentence generation with daily in-memory cache.
// One Haiku call per stakeholder_type per cron invocation, reused across all
// subscribers sharing that type. Max 4 generations per day.

import Anthropic from "@anthropic-ai/sdk";
import { STAKEHOLDER_LABELS } from "./utils";

const STAKES_SYSTEM =
  "You write one sentence explaining why a news story matters to a specific " +
  "professional audience. The sentence is factual, sourced from the story, " +
  "and contains no speculation or hedging. Do not start with 'This' or 'The'. " +
  "Do not use em dashes. Maximum 120 characters. Return the sentence only, no JSON.";

// In-memory cache: lives within a single cron invocation.
// Key: `${stakeholderType}_${todayDate}`, value: generated sentence.
const stakesCache = new Map<string, string>();

/**
 * Returns a stakes sentence for the given stakeholder type and lead story.
 * Generates once per type per day (Haiku, temp=0), caches and reuses.
 * Returns null on any failure (panel dropped, not guessed).
 */
export async function getStakesSentence(
  stakeholderType: string,
  todayDate: string,
  storyTitle: string,
  storySummary: string,
  anthropic: Anthropic,
): Promise<string | null> {
  const cacheKey = `${stakeholderType}_${todayDate}`;
  const cached = stakesCache.get(cacheKey);
  if (cached) return cached;

  const label = STAKEHOLDER_LABELS[stakeholderType];
  if (!label) return null;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      temperature: 0,
      system: [{ type: "text", text: STAKES_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Audience: ${stakeholderType.replace(/_/g, " ")} professional.\nStory: ${storyTitle}\nSummary: ${storySummary}`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    if (!text || text.length < 10) return null;
    stakesCache.set(cacheKey, text);
    return text;
  } catch {
    return null;
  }
}

/** Clear the cache (for testing). */
export function clearStakesCache(): void {
  stakesCache.clear();
}
