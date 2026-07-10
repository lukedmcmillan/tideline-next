// app/lib/brief/insights.ts
// Per-evidence insight panel generation with typed declaration.
// Model declares "stakeholder" or "tidelines_read"; renderer trusts the type.
// Invalid or missing type → panel dropped, never guessed.

import Anthropic from "@anthropic-ai/sdk";

export interface InsightPanel {
  type: "stakeholder" | "tidelines_read";
  text: string;
}

const INSIGHT_SYSTEM =
  "You write a one-sentence insight for an ocean governance news story. " +
  "Return JSON only: {\"type\": \"stakeholder\" | \"tidelines_read\", \"text\": \"...\"}\n\n" +
  "Rules:\n" +
  "- \"stakeholder\": when the implication is factual and sourced from the story. " +
  "The sentence states what the story means for the named professional audience.\n" +
  "- \"tidelines_read\": when the insight is inference or editorial. The sentence " +
  "MUST include an honest caveat about what has NOT happened or is NOT confirmed. " +
  "Start with a factual claim, then qualify.\n\n" +
  "Maximum 140 characters for the text field. No em dashes. No hedging words " +
  "like 'could potentially' or 'may possibly'. One clear sentence.";

// In-memory cache: keyed by storyId + stakeholderType.
// Lives within a single cron invocation.
const insightCache = new Map<string, InsightPanel | null>();

/**
 * Generates an insight panel for a single evidence item.
 * Cached per storyId + stakeholderType within the cron run.
 * Returns null on any failure or invalid type (panel dropped).
 */
export async function generateInsightPanel(
  storyId: string,
  storyTitle: string,
  storySummary: string,
  stakeholderType: string,
  anthropic: Anthropic,
): Promise<InsightPanel | null> {
  const cacheKey = `${storyId}_${stakeholderType}`;
  if (insightCache.has(cacheKey)) return insightCache.get(cacheKey) ?? null;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      temperature: 0,
      system: [{ type: "text", text: INSIGHT_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Audience: ${stakeholderType.replace(/_/g, " ")} professional.\nTitle: ${storyTitle}\nSummary: ${storySummary}`,
      }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      insightCache.set(cacheKey, null);
      return null;
    }

    const parsed = JSON.parse(match[0]);

    // Schema validation: type must be exactly one of the two values
    if (parsed.type !== "stakeholder" && parsed.type !== "tidelines_read") {
      insightCache.set(cacheKey, null);
      return null;
    }
    // Text must be non-empty
    if (typeof parsed.text !== "string" || parsed.text.trim().length < 5) {
      insightCache.set(cacheKey, null);
      return null;
    }

    const panel: InsightPanel = { type: parsed.type, text: parsed.text.trim() };
    insightCache.set(cacheKey, panel);
    return panel;
  } catch {
    insightCache.set(cacheKey, null);
    return null;
  }
}

/** Clear the cache (for testing). */
export function clearInsightCache(): void {
  insightCache.clear();
}
