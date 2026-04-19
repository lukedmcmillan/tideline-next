import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RSS_SOURCES } from "@/app/lib/sources";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Scraped sources not in RSS_SOURCES
const SCRAPED_SOURCES = ["IMO", "ISA", "FAO Fisheries", "IUCN Red List", "CBD", "CITES", "UN BBNJ"];

interface SourceHealth {
  source_name: string;
  stories_7d: number;
  stories_prior_7d: number;
  stories_30d: number;
  last_story_at: string | null;
  flag: "healthy" | "recent_failure" | "chronic_failure" | "volume_crash" | "low_volume";
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get all stories from last 30 days grouped by source
  const { data: stories30, error: fetchErr } = await supabase
    .from("stories")
    .select("source_name, published_at")
    .gte("published_at", d30);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  // Build per-source stats
  const allSourceNames = new Set([
    ...RSS_SOURCES.map((s) => s.name),
    ...SCRAPED_SOURCES,
  ]);

  const stats = new Map<string, { stories_7d: number; stories_prior_7d: number; stories_30d: number; last_story_at: string | null }>();

  for (const name of allSourceNames) {
    stats.set(name, { stories_7d: 0, stories_prior_7d: 0, stories_30d: 0, last_story_at: null });
  }

  for (const story of stories30 || []) {
    const s = stats.get(story.source_name);
    if (!s) {
      stats.set(story.source_name, { stories_7d: 0, stories_prior_7d: 0, stories_30d: 0, last_story_at: story.published_at });
    }
    const entry = stats.get(story.source_name)!;
    entry.stories_30d++;
    if (story.published_at >= d7) entry.stories_7d++;
    else if (story.published_at >= d14) entry.stories_prior_7d++;
    if (!entry.last_story_at || story.published_at > entry.last_story_at) {
      entry.last_story_at = story.published_at;
    }
  }

  // Classify each source
  const results: SourceHealth[] = [];
  const recentFailures: SourceHealth[] = [];
  const chronicFailures: SourceHealth[] = [];
  const volumeCrashes: SourceHealth[] = [];

  for (const [name, s] of stats) {
    let flag: SourceHealth["flag"] = "healthy";

    if (s.stories_30d === 0) {
      flag = "chronic_failure";
    } else if (s.stories_7d === 0 && s.stories_prior_7d > 0) {
      flag = "recent_failure";
    } else if (s.stories_prior_7d > 0 && s.stories_7d < s.stories_prior_7d * 0.3) {
      flag = "volume_crash";
    } else if (s.stories_7d > 0 && s.stories_7d <= 1) {
      flag = "low_volume";
    }

    const entry: SourceHealth = {
      source_name: name,
      stories_7d: s.stories_7d,
      stories_prior_7d: s.stories_prior_7d,
      stories_30d: s.stories_30d,
      last_story_at: s.last_story_at,
      flag,
    };

    results.push(entry);
    if (flag === "recent_failure") recentFailures.push(entry);
    if (flag === "chronic_failure") chronicFailures.push(entry);
    if (flag === "volume_crash") volumeCrashes.push(entry);
  }

  // Log snapshots
  const snapshots = results.map((r) => ({
    source_name: r.source_name,
    stories_7d: r.stories_7d,
    stories_prior_7d: r.stories_prior_7d,
    stories_30d: r.stories_30d,
    last_story_at: r.last_story_at,
    flag: r.flag,
    checked_at: new Date().toISOString(),
  }));

  await supabase.from("source_health_snapshots").insert(snapshots).then((r) => {
    if (r.error) console.error("[source-health] snapshot insert:", r.error.message);
  });

  // Build and send email digest
  const healthy = results.filter((r) => r.flag === "healthy");
  const hasIssues = recentFailures.length > 0 || chronicFailures.length > 0 || volumeCrashes.length > 0;

  if (hasIssues) {
    const F = "'DM Sans',Arial,sans-serif";

    const formatRow = (r: SourceHealth) =>
      `<tr><td style="padding:4px 12px;font-family:${F};font-size:13px;color:#3D4F63;">${r.source_name}</td>` +
      `<td style="padding:4px 12px;font-family:${F};font-size:13px;color:#3D4F63;text-align:center;">${r.stories_7d}</td>` +
      `<td style="padding:4px 12px;font-family:${F};font-size:13px;color:#3D4F63;text-align:center;">${r.stories_prior_7d}</td>` +
      `<td style="padding:4px 12px;font-family:${F};font-size:13px;color:#8BA0BC;">${r.last_story_at ? r.last_story_at.slice(0, 10) : "never"}</td></tr>`;

    const tableHeader = `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
      <tr style="border-bottom:1px solid #E8EAED;">
        <th style="padding:6px 12px;font-family:${F};font-size:11px;color:#8BA0BC;text-align:left;font-weight:500;">Source</th>
        <th style="padding:6px 12px;font-family:${F};font-size:11px;color:#8BA0BC;text-align:center;font-weight:500;">Last 7d</th>
        <th style="padding:6px 12px;font-family:${F};font-size:11px;color:#8BA0BC;text-align:center;font-weight:500;">Prior 7d</th>
        <th style="padding:6px 12px;font-family:${F};font-size:11px;color:#8BA0BC;text-align:left;font-weight:500;">Last seen</th>
      </tr>`;

    let sections = "";

    if (recentFailures.length > 0) {
      sections += `<h3 style="font-family:${F};font-size:14px;color:#E24B4A;margin:20px 0 8px;">Recent failures (${recentFailures.length})</h3>
        <p style="font-family:${F};font-size:12px;color:#8BA0BC;margin:0 0 8px;">Had stories last week, zero this week.</p>
        ${tableHeader}${recentFailures.map(formatRow).join("")}</table>`;
    }

    if (volumeCrashes.length > 0) {
      sections += `<h3 style="font-family:${F};font-size:14px;color:#EF9F27;margin:20px 0 8px;">Volume crashes (${volumeCrashes.length})</h3>
        <p style="font-family:${F};font-size:12px;color:#8BA0BC;margin:0 0 8px;">Volume dropped 70%+ week-over-week.</p>
        ${tableHeader}${volumeCrashes.map(formatRow).join("")}</table>`;
    }

    if (chronicFailures.length > 0) {
      sections += `<h3 style="font-family:${F};font-size:14px;color:#8BA0BC;margin:20px 0 8px;">Chronic failures (${chronicFailures.length})</h3>
        <p style="font-family:${F};font-size:12px;color:#8BA0BC;margin:0 0 8px;">Zero stories in last 30 days.</p>
        <ul style="font-family:${F};font-size:13px;color:#5B6F8C;margin:0;padding:0 0 0 20px;">
          ${chronicFailures.map((r) => `<li>${r.source_name}</li>`).join("")}
        </ul>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#fff;font-family:${F};">
        <div style="max-width:600px;margin:20px auto;padding:0 20px;">
          <div style="padding:16px 0;border-bottom:1px solid #E8EAED;">
            <span style="font-family:${F};font-size:16px;font-weight:700;color:#0B1628;">Tideline</span>
            <span style="font-family:${F};font-size:10px;color:#1D9E75;letter-spacing:0.15em;text-transform:uppercase;margin-left:8px;">SOURCE HEALTH</span>
          </div>
          <p style="font-family:${F};font-size:14px;color:#3D4F63;margin:16px 0 8px;">
            ${healthy.length} of ${results.length} sources healthy.
            ${recentFailures.length} new failures, ${volumeCrashes.length} volume drops, ${chronicFailures.length} chronic.
          </p>
          ${sections}
          <p style="font-family:${F};font-size:12px;color:#8BA0BC;margin:24px 0 0;border-top:1px solid #E8EAED;padding-top:12px;">
            Automated weekly report from /api/cron/source-health
          </p>
        </div>
      </body></html>`;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tideline Ops <noreply@thetideline.co>",
          to: "luke@thetideline.co",
          subject: `Source health: ${recentFailures.length} new failures, ${chronicFailures.length} chronic — ${new Date().toISOString().slice(0, 10)}`,
          html,
        }),
      });
    } catch (err) {
      console.error("[source-health] Email failed:", err);
    }
  }

  return NextResponse.json({
    total_sources: results.length,
    healthy: healthy.length,
    recent_failures: recentFailures.length,
    chronic_failures: chronicFailures.length,
    volume_crashes: volumeCrashes.length,
    recent_failure_names: recentFailures.map((r) => r.source_name),
    chronic_failure_names: chronicFailures.map((r) => r.source_name),
    volume_crash_names: volumeCrashes.map((r) => r.source_name),
  });
}
