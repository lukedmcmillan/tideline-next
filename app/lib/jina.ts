export async function fetchViaJina(
  url: string,
  format: "html" | "markdown" = "markdown"
): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: format === "html" ? "text/html" : "text/plain",
        "X-Return-Format": format,
        "X-Timeout": "15",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
