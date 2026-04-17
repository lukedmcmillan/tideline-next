import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function scoreConfidence(summary: {
  title: string;
  short_summary?: string;
  full_summary?: string;
  summary?: string;
  source_name: string;
}): Promise<{ score: number; flags: string[] }> {
  try {
    const summaryText = summary.full_summary || summary.summary || summary.short_summary || "";
    const shortText = summary.short_summary || "";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: [{
        type: "text",
        text: `You are a fact-check reviewer for an ocean governance intelligence platform. Score this summary for accuracy risk 0 to 10.
10 = fully verifiable, specific, dated, grounded in the source.
0 = vague, unverifiable, speculative, or potentially misleading.

Consider:
- Are factual claims specific and checkable?
- Are numbers, dates, entities named explicitly?
- Does the summary avoid hedging, speculation, and advocacy?
- Is the tone professional intelligence, not opinion?

Return JSON only, no markdown, no explanation:
{"score": 0-10 integer, "flags": ["short lower-case flag", ...]}

Common flags: "vague", "unverifiable", "speculative", "advocacy_tone", "missing_date", "missing_source", "hedging", "generic_claim", "no_specifics"`,
        cache_control: { type: "ephemeral" },
      }],
      messages: [{
        role: "user",
        content: `Title: "${summary.title}"
Source: ${summary.source_name}

${shortText ? `Short summary: ${shortText}\n\n` : ""}${summaryText ? `Summary: ${summaryText}` : ""}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const rawScore = typeof parsed.score === "number" ? parsed.score : 0;
    const score = Math.max(0, Math.min(10, Math.round(rawScore)));
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.filter((f: unknown): f is string => typeof f === "string").slice(0, 10)
      : [];
    return { score, flags };
  } catch (err) {
    console.error("[confidence] score error:", err);
    return { score: 0, flags: ["scoring_error"] };
  }
}
