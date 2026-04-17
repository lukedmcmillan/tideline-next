"use client";

import TopicsSelector from "@/components/TopicsSelector";

const SANS = "'DM Sans', -apple-system, sans-serif";
const DISPLAY = "'Plus Jakarta Sans', 'DM Sans', sans-serif";
const BG = "#0B1628";
const TEXT = "#E8EDF4";
const TEXT_MUTED = "#8BA0BC";

export default function TopicsSettingsPage() {
  return (
    <div style={{ background: BG, minHeight: "100%", color: TEXT, fontFamily: SANS, padding: "40px 32px 80px" }}>
      <div style={{ maxWidth: 640 }}>
        <h1 style={{
          fontFamily: DISPLAY, fontWeight: 800, fontSize: 24,
          letterSpacing: "-0.02em", marginBottom: 6,
        }}>
          Your topics
        </h1>
        <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 28, lineHeight: 1.5 }}>
          Pick up to 5 domains. Your brief, alerts, and dashboard update automatically.
        </p>
        <TopicsSelector />
      </div>
    </div>
  );
}
