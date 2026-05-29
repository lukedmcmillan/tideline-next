import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const key = process.env.JINA_API_KEY;
  if (!key) { console.error("JINA_API_KEY not set"); process.exit(1); }
  console.log("JINA_API_KEY present: YES (env var: JINA_API_KEY)");

  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "jina-embeddings-v2-base-en", input: ["ocean governance regulation test"] }),
    signal: AbortSignal.timeout(15000),
  });

  console.log("HTTP status:", res.status, res.statusText);
  console.log("Rate-limit headers:");
  for (const h of [
    "x-ratelimit-limit-requests", "x-ratelimit-remaining-requests",
    "x-ratelimit-limit-tokens", "x-ratelimit-remaining-tokens",
    "x-ratelimit-reset-requests", "x-ratelimit-reset-tokens", "retry-after",
  ]) {
    const v = res.headers.get(h);
    if (v) console.log(`  ${h}: ${v}`);
  }

  const data = await res.json();
  const emb = data.data[0].embedding;
  console.log("Embedding dimension:", emb.length);
  console.log("First 5 values:", emb.slice(0, 5));
  console.log("Model:", data.model);
  console.log("Usage:", JSON.stringify(data.usage));
}

main().catch(console.error);
