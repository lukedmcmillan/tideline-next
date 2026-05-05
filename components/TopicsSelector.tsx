"use client";

import { useEffect, useState } from "react";

const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Sans', ui-monospace, monospace";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const BG2 = "#0D1E35";
const BG3 = "#122845";
const BORDER = "#1A2A44";
const BORDER_HI = "#24375A";
const TEAL = "#1D9E75";
const TEAL_BRIGHT = "#27C893";
const AMBER = "#EF9F27";
const RED = "#E24B4A";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";
const TEXT_DIM = "#5B6F8C";

const MAX_TOPICS = 5;
const MIN_TOPICS = 1;

interface TrackerInfo {
  slug: string;
  name: string;
  score: number;
}

const TRACKERS: TrackerInfo[] = [
  { slug: "isa", name: "ISA Deep Sea Mining", score: 0 },
  { slug: "bbnj", name: "BBNJ High Seas Treaty", score: 0 },
  { slug: "iuu", name: "IUU Fishing", score: 0 },
  { slug: "30x30", name: "30x30 MPAs", score: 0 },
  { slug: "blue-finance", name: "Blue Finance", score: 0 },
  { slug: "plastics", name: "Plastics Treaty", score: 0 },
  { slug: "imo-shipping", name: "IMO Shipping", score: 0 },
  { slug: "offshore-wind", name: "Offshore Wind", score: 0 },
  { slug: "cites-marine", name: "CITES Marine", score: 0 },
  { slug: "wto-fisheries", name: "WTO Fisheries", score: 0 },
];

function bandColor(score: number): string {
  if (score >= 7) return TEAL_BRIGHT;
  if (score >= 4) return AMBER;
  if (score > 0) return RED;
  return TEXT_DIM;
}

export default function TopicsSelector({
  onSave,
  onCancel,
}: {
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  useEffect(() => {
    // Load current selections
    fetch("/api/user/topics")
      .then(r => r.ok ? r.json() : { slugs: [] })
      .then(d => {
        const slugs = new Set<string>(d.slugs || []);
        setSelected(slugs);
        setSaved(slugs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load current scores for display
    fetch("/api/dashboard")
      .then(r => r.ok ? r.json() : {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        const map: Record<string, number> = {};
        for (const v of d.velocityScores || []) {
          map[v.tracker_slug] = v.score;
        }
        setScores(map);
      })
      .catch(() => {});
  }, []);

  function toggle(slug: string) {
    setTooltip(null);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        if (next.size <= MIN_TOPICS) {
          setTooltip("At least 1 domain required");
          return prev;
        }
        next.delete(slug);
      } else {
        if (next.size >= MAX_TOPICS) {
          setTooltip("Maximum 5 domains");
          return prev;
        }
        next.add(slug);
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setTooltip(null);
    try {
      const r = await fetch("/api/user/topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: [...selected] }),
      });
      if (r.ok) {
        const d = await r.json();
        const newSet = new Set<string>(d.slugs || []);
        setSaved(newSet);
        setSelected(newSet);
        onSave?.();
      } else {
        const err = await r.json().catch(() => ({}));
        setTooltip((err as { error?: string }).error || "Save failed");
      }
    } catch {
      setTooltip("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSelected(new Set(saved));
    setTooltip(null);
    onCancel?.();
  }

  const changed = (() => {
    if (selected.size !== saved.size) return true;
    for (const s of selected) if (!saved.has(s)) return true;
    return false;
  })();

  if (loading) {
    return <div style={{ padding: 20, color: TEXT_DIM, fontSize: 13 }}>Loading preferences...</div>;
  }

  return (
    <div style={{ fontFamily: SANS }}>
      {/* Counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: TEXT_MUTED, textTransform: "uppercase" }}>
          Tracking <span style={{ color: selected.size >= MAX_TOPICS ? AMBER : TEAL_BRIGHT, fontWeight: 600 }}>{selected.size}</span> of {MAX_TOPICS} domains
        </div>
        {tooltip && (
          <div style={{ fontSize: 12, color: AMBER, fontWeight: 500 }}>{tooltip}</div>
        )}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {TRACKERS.map(t => {
          const on = selected.has(t.slug);
          const score = scores[t.slug] ?? t.score;
          const bc = bandColor(score);
          const atMax = !on && selected.size >= MAX_TOPICS;
          return (
            <button
              key={t.slug}
              onClick={() => toggle(t.slug)}
              disabled={atMax}
              style={{
                background: on ? BG3 : BG2,
                border: `1px solid ${on ? TEAL : BORDER}`,
                borderRadius: 10,
                padding: "14px 16px",
                cursor: atMax ? "not-allowed" : "pointer",
                opacity: atMax ? 0.4 : 1,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                position: "relative",
                transition: "border-color 150ms, background 150ms",
              }}
            >
              {/* Top stripe */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: on ? TEAL : "transparent",
                borderRadius: "10px 10px 0 0",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{t.name}</span>
                {on && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect width="16" height="16" rx="3" fill={TEAL} />
                    <path d="M4 8l3 3 5-6" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {score > 0 && (
                  <>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: bc }}>{score.toFixed(1)}</span>
                    <div style={{ flex: 1, height: 3, background: BORDER, borderRadius: 2 }}>
                      <div style={{ width: `${(score / 10) * 100}%`, height: "100%", background: bc, borderRadius: 2 }} />
                    </div>
                  </>
                )}
                {score === 0 && (
                  <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM }}>No score yet</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {onCancel && (
          <button
            onClick={cancel}
            style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 500,
              padding: "8px 16px", borderRadius: 7, cursor: "pointer",
              background: "transparent", color: TEXT_MUTED,
              border: `1px solid ${BORDER_HI}`,
            }}
          >Cancel</button>
        )}
        <button
          onClick={save}
          disabled={!changed || saving}
          style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            padding: "8px 20px", borderRadius: 7, border: "none",
            cursor: changed && !saving ? "pointer" : "default",
            background: changed ? TEAL : BORDER,
            color: changed ? "#0A1628" : TEXT_DIM,
            transition: "background 150ms",
          }}
        >{saving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  );
}
