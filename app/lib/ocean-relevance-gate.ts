import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a content relevance filter for an ocean intelligence platform.

Given the story below, determine whether it is substantively about any of the following topics:
- Ocean, marine environment, or coastal ecosystems
- Fisheries, aquaculture, or seafood industry
- Maritime industry, shipping, or ports
- Ocean governance, marine policy, or ocean law (UNCLOS, ISA, IMO, etc.)
- Marine biodiversity, coral reefs, marine protected areas
- Sea-level rise, ocean acidification, or ocean-climate interactions
- Antarctic or Arctic marine environments
- Offshore energy (wind, oil & gas)
- Marine pollution, plastics in the ocean, or ocean waste
- Ocean science, oceanography research, or marine biology
- Blue economy, blue finance, or sustainable ocean investment
- Deep-sea mining, seabed resources, or ISA-related activity
- Freshwater fisheries, river fish migrations, anadromous species (salmon, sturgeon), inland fisheries governance
- Fishing effort statistics, vessel monitoring, catch reporting, fisheries data and quota management

Be INCLUSIVE: if the story is tangentially related (e.g. a climate policy that mentions ocean obligations, a trade agreement affecting fisheries, or a biodiversity treaty relevant to marine species), answer yes.

However, brief or incidental mentions of the ocean in an otherwise off-topic story do not count as "substantively about." The ocean or marine domain must be a meaningful subject of the story, not just a passing aside or a single line in a longer piece on unrelated topics.

Only answer "no" for stories with NO meaningful connection to the ocean or marine domain (e.g. purely terrestrial air quality, land-based agriculture with no marine link, domestic politics unrelated to ocean).

Answer with exactly one word: yes or no`;

export interface GateResult {
  relevant: boolean;
  verdict: string;
  raw: string;
  duration_ms: number;
}

export async function checkOceanRelevance(story: {
  title: string;
  content: string;
}): Promise<GateResult> {
  const start = Date.now();
  const contentSnippet = (story.content || "").slice(0, 500);
  const userMessage = `TITLE: ${story.title}\nCONTENT: ${contentSnippet}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const message = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 5,
        messages: [{ role: "user", content: userMessage }],
        system: SYSTEM_PROMPT,
      },
      { signal: controller.signal },
    );

    clearTimeout(timeout);
    const duration_ms = Date.now() - start;

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const normalised = raw.toLowerCase().trim();
    const firstWord = normalised.split(/\s+/)[0];

    if (firstWord === "yes") {
      return { relevant: true, verdict: "yes", raw, duration_ms };
    }
    if (firstWord === "no") {
      return { relevant: false, verdict: "no", raw, duration_ms };
    }
    // Ambiguous response — treat as not relevant (quarantine)
    return { relevant: false, verdict: "ambiguous", raw, duration_ms };
  } catch {
    // Fail-open: gate unavailable, let the story through
    return {
      relevant: true,
      verdict: "gate_unavailable",
      raw: "",
      duration_ms: Date.now() - start,
    };
  }
}
