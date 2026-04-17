"use client";

import type { HeroSignalData } from "@/app/lib/types/dashboard";

const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const AMBER_SOFT = "rgba(239,159,39,0.15)";
const RED = "#E24B4A";
const RED_SOFT = "rgba(226,75,74,0.15)";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";
const BORDER = "#1A2A44";
const BORDER_HI = "#24375A";
const BG3 = "#122845";

const AVATAR_COLORS: Record<string, string> = {
  gov: "#F5C56F", reg: "#E88B8B", ngo: "#7DB8A0", res: "#B09FD8", media: "#D4B87A", esg: "#7BC4C4",
};

type D = NonNullable<HeroSignalData["divergence"]>;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sevLabel(score: number): string {
  if (score >= 8) return "HIGH";
  if (score >= 5) return "MEDIUM";
  return "LOW";
}

export default function HeroSignalDivergence({ d }: { d: D }) {
  const sev = sevLabel(d.score);
  const isHigh = sev === "HIGH";
  const scoreColor = isHigh ? RED : AMBER;
  const initial = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Eyebrow row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: TEXT_MUTED, textTransform: "uppercase" }}>
          Signal of the day
        </span>
        <span style={{
          padding: "3px 8px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: 4, fontWeight: 500,
          background: RED_SOFT, color: RED, border: "1px solid rgba(226,75,74,0.3)",
        }}>
          &#9679; {sev}
        </span>
        <span style={{
          padding: "3px 8px", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: 4,
          color: TEXT_MUTED, border: `1px solid ${BORDER_HI}`,
        }}>
          {d.tracker_tag.replace(/-/g, " ")}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10.5, color: TEXT_MUTED }}>
          {timeAgo(d.detected_at)}
        </span>
      </div>

      {/* Type label */}
      <div style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em",
        color: RED, textTransform: "uppercase", marginBottom: 10,
      }}>
        Source divergence detected
      </div>

      {/* Headline — accent text after colon if present */}
      <h2 style={{
        fontFamily: DISPLAY, fontWeight: 800, fontSize: 28,
        lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20,
        color: TEXT,
      }}>
        {d.headline.includes(": ") ? (
          <>
            {d.headline.split(": ")[0]}:{" "}
            <span style={{ color: TEAL_BRIGHT }}>{d.headline.split(": ").slice(1).join(": ")}</span>
          </>
        ) : d.headline}
      </h2>

      {/* Divergence bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: TEXT_MUTED, textTransform: "uppercase" }}>
          Divergence
        </span>
        <div style={{ flex: 1, height: 6, background: BG3, borderRadius: 3, overflow: "hidden", position: "relative" }}>
          <div style={{
            height: "100%", width: `${Math.min(100, (d.score / 10) * 100)}%`,
            background: `linear-gradient(90deg, ${AMBER}, ${RED})`,
            borderRadius: 3,
          }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 500, color: scoreColor }}>
          {d.score.toFixed(1)} / 10
        </span>
      </div>

      {/* Sources grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0, marginBottom: 20 }}>
        <SourceCol name={d.source_a_name} type={d.source_a_type} claim={d.source_a_claim} date={d.source_a_date || d.detected_at} side="left" />
        <div style={{
          display: "grid", placeItems: "center",
          fontFamily: MONO, fontSize: 10, color: TEXT_DIM,
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0 8px", borderRight: `1px solid ${BORDER}`,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: BG3, border: `1px solid ${BORDER_HI}`,
            display: "grid", placeItems: "center", fontSize: 9, letterSpacing: "0.08em",
          }}>vs</div>
        </div>
        <SourceCol name={d.source_b_name} type={d.source_b_type} claim={d.source_b_claim} date={d.source_b_date || d.detected_at} side="right" />
      </div>

      {/* Why this matters */}
      <div style={{
        borderLeft: `2px solid ${AMBER}`,
        padding: "10px 14px",
        background: AMBER_SOFT,
        borderRadius: "0 6px 6px 0",
        marginBottom: 18,
        fontSize: 12.5, lineHeight: 1.55, color: TEXT,
      }}>
        <b style={{ color: AMBER, fontWeight: 600 }}>Why this matters:</b>{" "}
        {d.why_it_matters}
      </div>

      {/* Actions: exactly 3 buttons, NO "Track dispute" */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button style={{
          fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: TEAL, color: "#0A1628", letterSpacing: "-0.005em",
        }}>Add to workspace</button>
        <button style={{
          fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, cursor: "pointer",
          background: "transparent", color: TEXT_MUTED,
          border: `1px solid ${BORDER_HI}`, letterSpacing: "-0.005em",
        }}>View sources</button>
        <button style={{
          fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: "transparent", color: TEXT_DIM,
          marginLeft: "auto", letterSpacing: "-0.005em",
        }}>Dismiss</button>
      </div>
    </div>
  );
}

function SourceCol({ name, type, claim, date, side }: {
  name: string; type: string; claim: string; date: string; side: "left" | "right";
}) {
  const avatarBg = AVATAR_COLORS[type] || "#8BA0BC";
  const initial = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} UTC`;
  };

  return (
    <div style={{
      padding: "14px 16px",
      paddingLeft: side === "left" ? 0 : 16,
      paddingRight: side === "right" ? 0 : 16,
      borderRight: side === "left" ? `1px solid ${BORDER}` : "none",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 4,
          display: "grid", placeItems: "center",
          fontFamily: DISPLAY, fontSize: 10, fontWeight: 700,
          color: "#0A1628", background: avatarBg, flexShrink: 0,
        }}>{initial}</div>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: TEXT,
          flex: 1, minWidth: 0, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{name}</div>
        <div style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em",
          color: TEXT_DIM, textTransform: "uppercase",
        }}>{type}</div>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: TEXT, marginBottom: 8 }}>{claim}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TEXT_MUTED }}>{fmtDate(date)}</div>
    </div>
  );
}
