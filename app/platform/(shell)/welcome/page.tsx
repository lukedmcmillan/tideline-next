import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/auth";
import { getWelcomeData, type WelcomeEntity } from "@/app/lib/welcome/data";
import { entityTypeLabel } from "@/app/lib/entity-type-label";
import WelcomeCTA from "./WelcomeCTA";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Design tokens (match shell layout) ────────────────────────────────────
const WHITE   = "#FFFFFF";
const BG      = "#F8F9FA";
const NAVY    = "#0A1628";
const TEAL    = "#1D9E75";
const T1      = "#202124";
const T2      = "#3C4043";
const T3      = "#5F6368";
const T4      = "#9AA0A6";
const BORDER  = "#DADCE0";
const BLT     = "#E8EAED";
const F       = "'DM Sans', -apple-system, sans-serif";
const M       = "var(--font-sans), 'DM Sans', sans-serif";

const BAND_COLORS = {
  HIGH:     { bg: "#F0FBF6", text: TEAL, dot: TEAL },
  ELEVATED: { bg: "#FFFBF0", text: "#B06000", dot: "#F9AB00" },
  LOW:      { bg: "#FFF5F5", text: "#A00000", dot: "#D93025" },
  null:     { bg: BG,        text: T4,     dot: T4 },
};

const MOMENTUM_LABEL: Record<string, string> = {
  accelerating: "↑ Accelerating",
  stable:       "→ Stable",
  decelerating: "↓ Decelerating",
};

// ── Sparkline SVG (pure server-renderable) ────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) {
    return (
      <svg width="80" height="28" viewBox="0 0 80 28">
        <line x1="0" y1="14" x2="80" y2="14" stroke={BORDER} strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  const W = 80;
  const H = 28;
  const PAD = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Entity card ───────────────────────────────────────────────────────────
function EntityCard({ entity }: { entity: WelcomeEntity }) {
  const band = entity.pulse_band ?? null;
  const colors = BAND_COLORS[band ?? "null"];

  return (
    <Link
      href="/platform/directory"
      className="welcome-entity-card"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name */}
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1, lineHeight: 1.3 }}>
                {entity.name}
              </span>
            </div>
            {/* Entity type + tracker tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: M, fontSize: 10, color: T4,
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {entityTypeLabel(entity.entity_type)}
              </span>
              {entity.tracker_tag && (
                <>
                  <span style={{ color: BORDER, fontSize: 10 }}>·</span>
                  <span style={{
                    fontFamily: M, fontSize: 10, color: TEAL,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    {entity.tracker_tag}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Pulse score badge */}
          <div style={{
            background: colors.bg,
            borderRadius: 6,
            padding: "5px 9px",
            textAlign: "center",
            flexShrink: 0,
            minWidth: 48,
          }}>
            <div style={{ fontFamily: M, fontSize: 15, fontWeight: 700, color: colors.text, lineHeight: 1 }}>
              {entity.pulse_score !== null ? entity.pulse_score.toFixed(1) : "—"}
            </div>
            <div style={{ fontFamily: M, fontSize: 9, color: colors.text, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              {band ?? "no data"}
            </div>
          </div>
        </div>

        {/* Sparkline + momentum */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Sparkline data={entity.sparkline_data} color={colors.dot} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {entity.momentum_direction ? (
              <div style={{ fontFamily: M, fontSize: 11, color: T3 }}>
                {MOMENTUM_LABEL[entity.momentum_direction]}
              </div>
            ) : (
              <div style={{ fontFamily: M, fontSize: 11, color: T4 }}>No trend data</div>
            )}
            <div style={{ fontFamily: M, fontSize: 11, color: T4, marginTop: 1 }}>
              {entity.mentions_30d} mentions · 30 days
            </div>
          </div>
        </div>

        {/* Why it matters */}
        <div style={{
          borderTop: `1px solid ${BLT}`,
          paddingTop: 8,
          fontFamily: F,
          fontSize: 12,
          lineHeight: 1.4,
          color: T2,
        }}>
          <span style={{ fontFamily: M, fontSize: 9, color: T4, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 3 }}>
            Why it matters
          </span>
          {entity.why_it_matters}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  // Look up userId from email
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user?.id) redirect("/login");

  const { entities } = await getWelcomeData(user.id);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 24px" }}>
      <style>{`.welcome-entity-card > div { transition: border-color 0.15s; } .welcome-entity-card:hover > div { border-color: #B0BEC5 !important; }`}</style>
      {/* Masthead */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{
          fontFamily: F, fontSize: 24, fontWeight: 700, color: NAVY,
          letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 6px",
        }}>
          Welcome to Tideline
        </h1>
        <p style={{
          fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.4,
          margin: 0, maxWidth: 520,
        }}>
          Based on your selections, here are the three entities generating the most
          ocean intelligence activity right now. Your daily brief starts tomorrow morning.
        </p>
      </div>

      {/* Entity cards */}
      {entities.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {entities.map((entity) => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      ) : (
        <div style={{
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8,
          padding: "24px 16px", textAlign: "center", marginBottom: 16,
          fontFamily: F, fontSize: 13, color: T4,
        }}>
          No entity data available yet — your brief will include full coverage once
          your entities are indexed.
        </div>
      )}

      {/* CTA */}
      <div style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T1, marginBottom: 2 }}>
            Ready to explore?
          </div>
          <div style={{ fontFamily: F, fontSize: 12, color: T3 }}>
            Your full feed, trackers, and governance calendar are waiting.
          </div>
        </div>
        <WelcomeCTA />
      </div>
    </div>
  );
}
