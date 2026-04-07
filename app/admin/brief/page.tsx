import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import OverrideButtons from "./OverrideButtons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WHITE = "#FFFFFF";
const TEAL = "#1D9E75";
const T1 = "#202124";
const T2 = "#3C4043";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const BD = "#DADCE0";
const AMBER = "#F9AB00";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

function fmtDate(d: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

type BriefLog = {
  id: string;
  date: string;
  overall_quality: string;
  failed_count: number;
  raw_feedback: string | null;
  created_at: string;
};

type Story = {
  id: string;
  title: string;
  source_name: string;
  published_at: string;
  confidence_score: number | null;
  confidence_flags: string[] | null;
  link: string | null;
};

type DistributionRow = { bucket: string; count: number };

export default async function AdminBriefPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user || session.user.role !== "admin") {
    redirect("/platform/feed");
  }

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs } = await supabase
    .from("brief_quality_log")
    .select("id, date, overall_quality, failed_count, raw_feedback, created_at")
    .gte("date", fourteenDaysAgo)
    .order("date", { ascending: false });

  const briefLogs: BriefLog[] = logs || [];

  const { data: pendingStories } = await supabase
    .from("stories")
    .select("id, title, source_name, published_at, confidence_score, confidence_flags, link")
    .eq("status", "pending_review")
    .order("published_at", { ascending: false })
    .limit(100);

  const pending: Story[] = pendingStories || [];

  const { data: distRows } = await supabase
    .from("stories")
    .select("confidence_score")
    .gte("published_at", sevenDaysAgo)
    .not("confidence_score", "is", null);

  const distribution = buildDistribution(distRows || []);

  return (
    <div style={{ minHeight: "100vh", background: WHITE, padding: "32px 40px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>
            Admin
          </div>
          <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: T1, letterSpacing: "-0.5px", margin: 0 }}>
            Brief operations
          </h1>
          <p style={{ fontFamily: F, fontSize: 13, color: T3, lineHeight: 1.5, margin: "8px 0 0", maxWidth: 640 }}>
            Review daily brief runs, promote or dismiss pending stories, and monitor confidence distribution across the feed.
          </p>
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: T1, margin: "0 0 12px" }}>
            Brief runs, last 14 days
          </h2>
          {briefLogs.length === 0 ? (
            <p style={{ fontFamily: F, fontSize: 13, color: T4, margin: 0 }}>No brief runs recorded in the last 14 days.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BD}` }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Failed</th>
                  <th style={thStyle}>Logged at</th>
                  <th style={thStyle}>Failures</th>
                </tr>
              </thead>
              <tbody>
                {briefLogs.map((log) => {
                  const failedItems = parseFailures(log.raw_feedback);
                  return (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${BD}`, verticalAlign: "top" }}>
                      <td style={tdStyle}>{fmtDate(log.date)}</td>
                      <td style={tdStyle}>
                        <StatusPill status={log.overall_quality} />
                      </td>
                      <td style={{ ...tdStyle, fontFamily: M, color: log.failed_count > 0 ? AMBER : T3 }}>
                        {log.failed_count}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: M, fontSize: 11, color: T4 }}>
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: T3, maxWidth: 360 }}>
                        {failedItems.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {failedItems.slice(0, 4).map((f, i) => (
                              <li key={i}><strong style={{ color: T2 }}>#{f.index}</strong> {f.reason}</li>
                            ))}
                            {failedItems.length > 4 && <li style={{ color: T4 }}>+ {failedItems.length - 4} more</li>}
                          </ul>
                        ) : (
                          <span style={{ color: T4 }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: T1, margin: "0 0 12px" }}>
            Confidence distribution, last 7 days
          </h2>
          <div style={{ fontFamily: M, fontSize: 12, color: T3, lineHeight: 2 }}>
            {distribution.map((d) => (
              <div key={d.bucket} style={{ display: "flex", gap: 16 }}>
                <span style={{ minWidth: 160, color: T2 }}>{d.bucket}</span>
                <span style={{ color: T1, fontWeight: 600 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: T1, margin: "0 0 12px" }}>
            Pending review queue ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p style={{ fontFamily: F, fontSize: 13, color: T4, margin: 0 }}>Nothing pending. All summarised stories passed the confidence gate.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BD}` }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Published</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Flags</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${BD}`, verticalAlign: "top" }}>
                    <td style={{ ...tdStyle, maxWidth: 360 }}>
                      {s.link ? (
                        <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: T1, textDecoration: "none", fontWeight: 500 }}>
                          {s.title}
                        </a>
                      ) : (
                        <span style={{ color: T1 }}>{s.title}</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: M, fontSize: 11, color: T3 }}>{s.source_name}</td>
                    <td style={{ ...tdStyle, fontFamily: M, fontSize: 11, color: T4 }}>{fmtDate(s.published_at)}</td>
                    <td style={{ ...tdStyle, fontFamily: M, fontWeight: 600, color: scoreColor(s.confidence_score) }}>
                      {s.confidence_score ?? "-"}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>
                      {(s.confidence_flags || []).length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(s.confidence_flags || []).map((flag) => (
                            <span key={flag} style={{ fontFamily: M, fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#FFF8E1", color: "#92400E", border: "1px solid #FDE68A" }}>
                              {flag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: T4 }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <OverrideButtons storyId={s.id} adminEmail={session.user.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px 10px 0",
  fontFamily: M,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T4,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px 12px 0",
  color: T2,
  lineHeight: 1.5,
};

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; border: string; label: string }> = {
    publish: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC", label: "Published" },
    review: { bg: "#FEF9C3", color: "#A16207", border: "#FDE047", label: "Review" },
    reject: { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA", label: "Rejected" },
  };
  const c = config[status] || config.publish;
  return (
    <span style={{
      display: "inline-block",
      fontFamily: M,
      fontSize: 9,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      padding: "2px 8px",
      borderRadius: 4,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

function scoreColor(score: number | null): string {
  if (score == null) return T4;
  if (score >= 8) return "#15803D";
  if (score >= 5) return "#A16207";
  return "#991B1B";
}

function parseFailures(raw: string | null): { index: number; reason: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.failed_items) ? parsed.failed_items : [];
  } catch {
    return [];
  }
}

function buildDistribution(rows: { confidence_score: number | null }[]): DistributionRow[] {
  const buckets: Record<string, number> = {
    "0 to 2 (very low)": 0,
    "3 to 4 (low)": 0,
    "5 to 6 (mid)": 0,
    "7 to 8 (pass)": 0,
    "9 to 10 (strong)": 0,
  };
  for (const r of rows) {
    const s = r.confidence_score;
    if (s == null) continue;
    if (s <= 2) buckets["0 to 2 (very low)"]++;
    else if (s <= 4) buckets["3 to 4 (low)"]++;
    else if (s <= 6) buckets["5 to 6 (mid)"]++;
    else if (s <= 8) buckets["7 to 8 (pass)"]++;
    else buckets["9 to 10 (strong)"]++;
  }
  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
}
