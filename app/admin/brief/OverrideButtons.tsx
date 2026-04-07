"use client";

import { useState } from "react";

const TEAL = "#1D9E75";
const T2 = "#3C4043";
const BD = "#DADCE0";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";

export default function OverrideButtons({ storyId, adminEmail }: { storyId: string; adminEmail: string }) {
  const [loading, setLoading] = useState<"approve" | "dismiss" | null>(null);
  const [done, setDone] = useState<"approved" | "dismissed" | null>(null);

  const act = async (action: "approve" | "dismiss") => {
    setLoading(action);
    try {
      const res = await fetch("/api/admin/story-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: storyId, action, admin_email: adminEmail }),
      });
      if (res.ok) {
        setDone(action === "approve" ? "approved" : "dismissed");
      }
    } catch {}
    setLoading(null);
  };

  if (done) {
    return <span style={{ fontFamily: F, fontSize: 11, color: done === "approved" ? TEAL : "#991B1B" }}>{done}</span>;
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => act("approve")}
        disabled={loading !== null}
        style={{
          height: 26, padding: "0 10px",
          fontFamily: F, fontSize: 11, fontWeight: 600,
          color: "#FFFFFF", background: TEAL, border: "none", borderRadius: 6,
          cursor: loading ? "default" : "pointer", opacity: loading === "approve" ? 0.6 : 1,
        }}
      >
        {loading === "approve" ? "..." : "Approve"}
      </button>
      <button
        onClick={() => act("dismiss")}
        disabled={loading !== null}
        style={{
          height: 26, padding: "0 10px",
          fontFamily: F, fontSize: 11, fontWeight: 500,
          color: T2, background: "#FFFFFF", border: `1px solid ${BD}`, borderRadius: 6,
          cursor: loading ? "default" : "pointer", opacity: loading === "dismiss" ? 0.6 : 1,
        }}
      >
        {loading === "dismiss" ? "..." : "Dismiss"}
      </button>
    </div>
  );
}
