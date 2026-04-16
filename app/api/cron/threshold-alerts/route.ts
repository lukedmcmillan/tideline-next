import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES, PREP_HORIZON } from "@/app/lib/tracker-metadata";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Short slugs (used by velocity_scores) → long slugs (used by user_alert_preferences)
const SHORT_TO_LONG: Record<string, string> = {
  "isa": "isa-deep-sea-mining",
  "bbnj": "bbnj-high-seas-treaty",
  "iuu": "iuu-fishing",
  "30x30": "30x30-mpa",
  "blue-finance": "blue-finance-tnfd",
  "imo-shipping": "imo-shipping-emissions",
  "wto-fisheries": "wto-fisheries-subsidies",
  "offshore-wind": "offshore-wind",
  "cites-marine": "cites-marine",
  "plastics": "plastics-treaty",
};

const SHORT_SLUGS = Object.keys(SHORT_TO_LONG);

const DEDUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SEND_DELAY_MS = 100;

type Band = "LOW" | "WATCH" | "ELEVATED" | "HIGH";

// Per spec: <4 LOW, 4 ≤ s < 7 WATCH, 7 ≤ s ≤ 8.5 ELEVATED, s > 8.5 HIGH.
// Boundaries: 8.5 = ELEVATED, 8.6 = HIGH. No offshore-wind shift.
function bandFor(score: number): Band {
  if (score < 4) return "LOW";
  if (score < 7) return "WATCH";
  if (score <= 8.5) return "ELEVATED";
  return "HIGH";
}

function directionLabel(d: string | null | undefined): string {
  if (d === "accelerating") return "Accelerating";
  if (d === "decelerating") return "Decelerating";
  return "Stable";
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface VelocityRow {
  score: number;
  momentum_direction: "accelerating" | "stable" | "decelerating" | null;
  interpretation: string | null;
  calculated_at: string;
}

interface RecipientRow {
  user_id: string;
  email: string;
}

async function fetchLastTwoScores(shortSlug: string): Promise<VelocityRow[] | null> {
  const { data, error } = await supabase
    .from("velocity_scores")
    .select("score, momentum_direction, interpretation, calculated_at")
    .eq("tracker_slug", shortSlug)
    .order("calculated_at", { ascending: false })
    .limit(2);
  if (error) {
    console.error(`[threshold-alerts] velocity_scores fetch failed for ${shortSlug}:`, error.message);
    return null;
  }
  return (data ?? []) as VelocityRow[];
}

async function fetchRecipients(longSlug: string): Promise<RecipientRow[]> {
  // Two-step: alert_preferences (alerts_enabled=true) → users (active|trial only).
  const { data: prefs, error: prefErr } = await supabase
    .from("user_alert_preferences")
    .select("user_id")
    .eq("tracker_slug", longSlug)
    .eq("alerts_enabled", true);
  if (prefErr) {
    console.error(`[threshold-alerts] preferences fetch failed for ${longSlug}:`, prefErr.message);
    return [];
  }
  const userIds = (prefs ?? []).map(p => p.user_id);
  if (userIds.length === 0) return [];

  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, email, subscription_status")
    .in("id", userIds)
    .in("subscription_status", ["active", "trial"]);
  if (userErr) {
    console.error(`[threshold-alerts] users fetch failed:`, userErr.message);
    return [];
  }
  return (users ?? [])
    .filter(u => u.email)
    .map(u => ({ user_id: u.id as string, email: u.email as string }));
}

async function alreadyAlerted(
  userId: string,
  longSlug: string,
  bandFrom: Band,
  bandTo: Band,
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from("alert_sends")
    .select("id")
    .eq("user_id", userId)
    .eq("tracker_slug", longSlug)
    .eq("band_from", bandFrom)
    .eq("band_to", bandTo)
    .gte("sent_at", since)
    .limit(1);
  if (error) {
    console.error(`[threshold-alerts] dedup check failed:`, error.message);
    // Fail open: skip rather than risk duplicate sends if the table is unreachable.
    return true;
  }
  return (data ?? []).length > 0;
}

async function logSend(
  userId: string,
  longSlug: string,
  bandFrom: Band,
  bandTo: Band,
): Promise<boolean> {
  const { error } = await supabase
    .from("alert_sends")
    .insert({ user_id: userId, tracker_slug: longSlug, band_from: bandFrom, band_to: bandTo });
  if (error) {
    console.error(`[threshold-alerts] alert_sends insert failed:`, error.message);
    return false;
  }
  return true;
}

function buildEmail(args: {
  shortSlug: string;
  bandFrom: Band;
  bandTo: Band;
  score: number;
  direction: string | null | undefined;
  interpretation: string | null;
}): { subject: string; text: string } {
  const domainName = DOMAIN_NAMES[args.shortSlug] ?? args.shortSlug;
  const horizon = PREP_HORIZON[args.shortSlug] ?? "horizon not specified";
  const host = process.env.NEXTAUTH_URL ?? "https://thetideline.co";
  const link = `${host.replace(/\/$/, "")}/platform/tracker/${args.shortSlug}`;
  const interpretation = (args.interpretation ?? "").trim() ||
    `${domainName} activity has crossed a band threshold.`;

  const subject = `${domainName} just moved to ${args.bandTo}`;
  const text =
`The ${domainName} Pulse Score has crossed from ${args.bandFrom} to ${args.bandTo}.

Current score: ${args.score.toFixed(1)} / 10
Direction: ${directionLabel(args.direction)}

${interpretation}

Typical preparation horizon for this domain: ${horizon}.

View tracker: ${link}
`;

  return { subject, text };
}

async function sendPlainEmail(to: string, subject: string, text: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <luke@thetideline.co>",
        reply_to: "luke@thetideline.co",
        to,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[threshold-alerts] Resend send failed for ${to}: ${res.status} ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[threshold-alerts] Resend send threw for ${to}:`, e);
    return false;
  }
}

interface CrossingSummary {
  tracker_slug: string;
  band_from: Band;
  band_to: Band;
  score: number;
  recipients: number;
  emails_sent: number;
  emails_skipped_dedup: number;
  emails_failed: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summaries: CrossingSummary[] = [];
  let totalSent = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const shortSlug of SHORT_SLUGS) {
    const rows = await fetchLastTwoScores(shortSlug);
    if (!rows || rows.length < 2) continue;

    const current = rows[0];
    const previous = rows[1];
    const bandTo = bandFor(Number(current.score));
    const bandFrom = bandFor(Number(previous.score));
    if (bandFrom === bandTo) continue;

    const longSlug = SHORT_TO_LONG[shortSlug];
    const recipients = await fetchRecipients(longSlug);

    const summary: CrossingSummary = {
      tracker_slug: longSlug,
      band_from: bandFrom,
      band_to: bandTo,
      score: Number(current.score),
      recipients: recipients.length,
      emails_sent: 0,
      emails_skipped_dedup: 0,
      emails_failed: 0,
    };

    if (recipients.length === 0) {
      summaries.push(summary);
      continue;
    }

    const { subject, text } = buildEmail({
      shortSlug,
      bandFrom,
      bandTo,
      score: Number(current.score),
      direction: current.momentum_direction,
      interpretation: current.interpretation,
    });

    for (const r of recipients) {
      if (await alreadyAlerted(r.user_id, longSlug, bandFrom, bandTo)) {
        summary.emails_skipped_dedup += 1;
        totalSkipped += 1;
        continue;
      }
      const ok = await sendPlainEmail(r.email, subject, text);
      if (ok) {
        const logged = await logSend(r.user_id, longSlug, bandFrom, bandTo);
        if (logged) {
          summary.emails_sent += 1;
          totalSent += 1;
        } else {
          // Send succeeded but log failed — count as failed so it shows up in the summary.
          summary.emails_failed += 1;
          totalFailed += 1;
        }
      } else {
        summary.emails_failed += 1;
        totalFailed += 1;
      }
      await sleep(SEND_DELAY_MS);
    }

    summaries.push(summary);
  }

  return NextResponse.json({
    ok: true,
    checked: SHORT_SLUGS.length,
    crossings: summaries,
    emails_sent: totalSent,
    emails_skipped_dedup: totalSkipped,
    emails_failed: totalFailed,
  });
}
