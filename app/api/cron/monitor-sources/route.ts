import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RSS_SOURCES } from "@/app/lib/sources";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CheckResult {
  source_name: string;
  rss_url: string;
  http_status: number | null;
  response_time_ms: number;
  items_returned: number;
  most_recent_item: string | null;
  health: "healthy" | "stale" | "dead";
  error_message: string | null;
}

function extractMostRecentDate(xml: string): string | null {
  const datePatterns = [
    /<pubDate[^>]*>(.*?)<\/pubDate>/i,
    /<published[^>]*>(.*?)<\/published>/i,
    /<updated[^>]*>(.*?)<\/updated>/i,
    /<dc:date[^>]*>(.*?)<\/dc:date>/i,
  ];
  for (const pattern of datePatterns) {
    const match = xml.match(pattern);
    if (match) {
      const d = new Date(match[1].trim());
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

function countItems(xml: string): number {
  const items = xml.match(/<item[\s>]/gi) || [];
  const entries = xml.match(/<entry[\s>]/gi) || [];
  return Math.max(items.length, entries.length);
}

async function checkSource(source: { name: string; rss: string }): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(source.rss, {
      headers: { "User-Agent": "Tideline/1.0 Source Monitor" },
      signal: AbortSignal.timeout(10000),
    });
    const elapsed = Date.now() - start;

    if (!res.ok) {
      return {
        source_name: source.name,
        rss_url: source.rss,
        http_status: res.status,
        response_time_ms: elapsed,
        items_returned: 0,
        most_recent_item: null,
        health: "dead",
        error_message: `HTTP ${res.status}`,
      };
    }

    const xml = await res.text();
    const itemCount = countItems(xml);
    const mostRecent = extractMostRecentDate(xml);

    let health: "healthy" | "stale" | "dead" = "healthy";
    if (itemCount === 0) {
      health = "dead";
    } else if (mostRecent) {
      const age = Date.now() - new Date(mostRecent).getTime();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      if (age > fourteenDays) health = "stale";
    }

    return {
      source_name: source.name,
      rss_url: source.rss,
      http_status: res.status,
      response_time_ms: elapsed,
      items_returned: itemCount,
      most_recent_item: mostRecent,
      health,
      error_message: null,
    };
  } catch (err) {
    const elapsed = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      source_name: source.name,
      rss_url: source.rss,
      http_status: null,
      response_time_ms: elapsed,
      items_returned: 0,
      most_recent_item: null,
      health: "dead",
      error_message: msg.includes("abort") || msg.includes("timeout") ? "Timeout (10s)" : msg,
    };
  }
}

async function sendAlertEmail(deadSources: CheckResult[]) {
  const rows = deadSources
    .map((s) => `- ${s.source_name}: ${s.error_message || "No items"} (${s.rss_url})`)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tideline Ops <noreply@thetideline.co>",
      to: "luke@thetideline.co",
      subject: `Source monitor: ${deadSources.length} dead feeds`,
      text: `Weekly source health check found ${deadSources.length} dead RSS feeds:\n\n${rows}\n\nCheck the source_health_checks table for full details.`,
    }),
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check all sources (5 concurrent to avoid overwhelming)
  const results: CheckResult[] = [];
  const batchSize = 5;
  for (let i = 0; i < RSS_SOURCES.length; i += batchSize) {
    const batch = RSS_SOURCES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkSource));
    results.push(...batchResults);
  }

  const healthy = results.filter((r) => r.health === "healthy");
  const stale = results.filter((r) => r.health === "stale");
  const dead = results.filter((r) => r.health === "dead");

  // Write individual check results
  try {
    await supabase.from("source_health_checks").insert(
      results.map((r) => ({
        source_name: r.source_name,
        rss_url: r.rss_url,
        http_status: r.http_status,
        response_time_ms: r.response_time_ms,
        items_returned: r.items_returned,
        most_recent_item: r.most_recent_item,
        health: r.health,
        error_message: r.error_message,
      }))
    );
  } catch (err) {
    console.error("Failed to write health checks:", err);
  }

  // Write summary log
  try {
    await supabase.from("source_health_log").insert({
      total: results.length,
      healthy_count: healthy.length,
      stale_count: stale.length,
      dead_count: dead.length,
    });
  } catch (err) {
    console.error("Failed to write health log:", err);
  }

  // Alert if more than 3 dead sources
  if (dead.length > 3) {
    try {
      await sendAlertEmail(dead);
    } catch (err) {
      console.error("Failed to send alert email:", err);
    }
  }

  return NextResponse.json({
    total: results.length,
    healthy: healthy.length,
    stale: stale.length,
    dead: dead.length,
    dead_sources: dead.map((d) => ({
      name: d.source_name,
      error: d.error_message,
    })),
    stale_sources: stale.map((s) => ({
      name: s.source_name,
      most_recent: s.most_recent_item,
    })),
  });
}
