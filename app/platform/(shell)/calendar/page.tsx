"use client";

import { useState, useEffect } from "react";
import DesktopOnly from "@/components/DesktopOnly";

// ── Design tokens (match layout.tsx) ─────────────────────────────────────
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const TEAL   = "#1D9E75";
const AMBER  = "#F9AB00";
const RED    = "#D93025";
const T1     = "#202124";
const T2     = "#3C4043";
const T3     = "#5F6368";
const T4     = "#9AA0A6";
const BORDER = "#DADCE0";
const BLT    = "#E8EAED";
const F      = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

// ── Types ────────────────────────────────────────────────────────────────
interface Consultation {
  id: string;
  organisation: string;
  title: string;
  description: string | null;
  deadline: string;
  type: "consultation" | "event" | "deadline";
  covered: boolean;
  story_count: number;
  tracker_tags: string[] | null;
  days_remaining: number;
}

interface GroupedData {
  urgent: Consultation[];
  warning: Consultation[];
  upcoming: Consultation[];
}

// ── Filter helpers ───────────────────────────────────────────────────────
type FilterTab = "All" | "Consultations" | "Deadlines" | "Events" | "Covered";

function filterItems(items: Consultation[], tab: FilterTab): Consultation[] {
  if (tab === "All") return items;
  if (tab === "Consultations") return items.filter((c) => c.type === "consultation");
  if (tab === "Deadlines") return items.filter((c) => c.type === "deadline");
  if (tab === "Events") return items.filter((c) => c.type === "event");
  if (tab === "Covered") return items.filter((c) => c.covered);
  return items;
}

// ── Type badge colour ────────────────────────────────────────────────────
function typeBadgeStyle(type: string) {
  if (type === "consultation") return { background: "rgba(29,158,117,.1)", color: TEAL };
  if (type === "deadline") return { background: "rgba(217,48,37,.1)", color: RED };
  return { background: "rgba(249,171,0,.1)", color: AMBER };
}

// ── Format date ──────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Card ─────────────────────────────────────────────────────────────────
function ConsultationCard({
  item,
  borderColor,
}: {
  item: Consultation;
  borderColor: string;
}) {
  const badge = typeBadgeStyle(item.type);

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${BORDER}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: "20px 22px",
        marginBottom: 10,
      }}
    >
      {/* Top row: days remaining + date + type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-.03em",
            color: borderColor,
            minWidth: 40,
          }}
        >
          {item.days_remaining}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: T4, fontWeight: 500 }}>
            {item.days_remaining === 1 ? "day left" : "days left"}
          </span>
          <span style={{ fontSize: 12, color: T3 }}>{fmtDate(item.deadline)}</span>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".05em",
            textTransform: "uppercase",
            borderRadius: 4,
            padding: "3px 8px",
            ...badge,
          }}
        >
          {item.type}
        </span>
      </div>

      {/* Organisation + title */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".05em",
          textTransform: "uppercase",
          color: T4,
          marginBottom: 4,
        }}
      >
        {item.organisation}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: "-.015em",
          color: T1,
          marginBottom: 8,
        }}
      >
        {item.title}
      </div>

      {/* Description */}
      {item.description && (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: T3,
            marginBottom: 12,
          }}
        >
          {item.description}
        </div>
      )}

      {/* Tags + covered badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {item.tracker_tags?.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              border: `1px solid rgba(29,158,117,.22)`,
              borderRadius: 4,
              padding: "3px 9px",
              color: TEAL,
              background: "rgba(255,255,255,.7)",
            }}
          >
            {tag}
          </span>
        ))}
        {item.covered && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              background: "rgba(29,158,117,.1)",
              borderRadius: 4,
              padding: "3px 9px",
              color: TEAL,
            }}
          >
            Covered · {item.story_count} {item.story_count === 1 ? "story" : "stories"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href="/platform/research"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: TEAL,
            border: `1.5px solid rgba(29,158,117,.22)`,
            borderRadius: 8,
            padding: "7px 14px",
            background: WHITE,
            textDecoration: "none",
            cursor: "pointer",
            fontFamily: F,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <path d="M6.5 1v11M1 6.5h11" strokeLinecap="round" />
          </svg>
          Draft response
        </a>
        <button
          onClick={() => {
            const start = new Date(item.deadline);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const fmt = (d: Date) =>
              d
                .toISOString()
                .replace(/[-:]/g, "")
                .replace(/\.\d{3}/, "");
            window.open(
              `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(item.organisation + ": " + (item.description || ""))}`,
              "_blank"
            );
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: T3,
            border: `1.5px solid ${BORDER}`,
            borderRadius: 8,
            padding: "7px 14px",
            background: WHITE,
            cursor: "pointer",
            fontFamily: F,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <rect x="1" y="2" width="11" height="10" rx="1.5" />
            <path d="M4 1v2M9 1v2M1 5.5h11" />
          </svg>
          Add to calendar
        </button>
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────
function Section({
  label,
  items,
  borderColor,
}: {
  label: string;
  items: Consultation[];
  borderColor: string;
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: borderColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-.01em",
            color: T1,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 12, color: T4 }}>{items.length}</span>
      </div>
      {items.map((c) => (
        <ConsultationCard key={c.id} item={c} borderColor={borderColor} />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [data, setData] = useState<GroupedData | null>(null);
  const [tab, setTab] = useState<FilterTab>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/consultations")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tabs: FilterTab[] = ["All", "Consultations", "Deadlines", "Events", "Covered"];

  const urgent = data ? filterItems(data.urgent, tab) : [];
  const warning = data ? filterItems(data.warning, tab) : [];
  const upcoming = data ? filterItems(data.upcoming, tab) : [];

  return (
    <DesktopOnly featureName="Calendar">
    <div style={{ padding: "16px 24px 40px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-.02em",
            color: T1,
          }}
        >
          Consultation tracker
        </span>
      </div>
      <div style={{ fontSize: 13, color: T4, marginBottom: 20 }}>
        Open consultations, deadlines and events from monitored bodies.
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${BLT}`,
          marginBottom: 24,
        }}
      >
        {tabs.map((t) => {
          const on = tab === t;
          const label = t === "Covered" ? "Covered by Tideline" : t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontSize: 13,
                fontWeight: on ? 600 : 400,
                color: on ? T1 : T4,
                background: "none",
                border: "none",
                borderBottom: on ? `2px solid ${TEAL}` : "2px solid transparent",
                padding: "8px 18px",
                cursor: "pointer",
                fontFamily: F,
                transition: "all .15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>
          Loading consultations...
        </div>
      )}

      {!loading && urgent.length === 0 && warning.length === 0 && upcoming.length === 0 && (
        <div style={{ fontSize: 13, color: T4, padding: "40px 0", textAlign: "center" }}>
          No items match this filter.
        </div>
      )}

      {!loading && (
        <>
          <Section label="Closing within 14 days" items={urgent} borderColor={RED} />
          <Section label="Closing in 15\u201360 days" items={warning} borderColor={AMBER} />
          <Section label="Upcoming events" items={upcoming} borderColor={BORDER} />
        </>
      )}
    </div>
    </DesktopOnly>
  );
}
