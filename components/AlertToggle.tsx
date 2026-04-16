"use client";

import { useEffect, useState } from "react";

const F = "'DM Sans',system-ui,sans-serif";
const TEAL = "#1D9E75";
const OFF = "#DADCE0";
const T1 = "#202124";
const T2 = "#5F6368";

/**
 * Small toggle that controls whether the current user receives band-crossing
 * alerts for `trackerSlug`. Self-fetches state on mount, optimistic flip on
 * click, reverts on POST error. Renders nothing for unauthenticated users.
 */
export default function AlertToggle({ trackerSlug }: { trackerSlug: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/alerts/preferences?tracker_slug=${encodeURIComponent(trackerSlug)}`)
      .then(async r => {
        if (cancelled) return;
        if (r.status === 401) { setHidden(true); return; }
        if (!r.ok) { setHidden(true); return; }
        const j = await r.json();
        setEnabled(Boolean(j.alerts_enabled));
      })
      .catch(() => { if (!cancelled) setHidden(true); });
    return () => { cancelled = true; };
  }, [trackerSlug]);

  if (hidden || enabled === null) return null;

  async function flip() {
    if (busy) return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setBusy(true);
    try {
      const r = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracker_slug: trackerSlug, alerts_enabled: next }),
      });
      if (!r.ok) throw new Error("save failed");
    } catch {
      setEnabled(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  const trackBg = enabled ? TEAL : OFF;
  const labelColor = enabled ? T1 : T2;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 4px" }}>
      <button
        type="button"
        onClick={flip}
        disabled={busy}
        aria-pressed={enabled}
        aria-label="Alert me when this score changes band"
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: trackBg,
          border: "none",
          padding: 0,
          position: "relative",
          cursor: busy ? "default" : "pointer",
          transition: "background 200ms",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: enabled ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
            transition: "left 200ms",
            display: "block",
          }}
        />
      </button>
      <label
        onClick={flip}
        style={{
          fontFamily: F,
          fontSize: 13,
          color: labelColor,
          cursor: busy ? "default" : "pointer",
          userSelect: "none",
        }}
      >
        Alert me when this score changes band
      </label>
    </div>
  );
}
