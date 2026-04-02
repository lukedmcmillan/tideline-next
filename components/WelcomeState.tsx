"use client";

import { useState, useEffect } from "react";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const TEAL = "#1D9E75";
const T4 = "#9AA0A6";

const TRACKERS = [
  "BBNJ Treaty", "ISA Mining", "IUU Enforcement", "30x30 Protection", "Blue Finance",
  "IMO Shipping", "Whaling", "Ocean Carbon", "Marine Spatial Planning", "Arctic",
];

interface Story {
  id: string;
  title: string;
  source_name: string;
  short_summary: string | null;
}

export default function WelcomeState({ onComplete }: { onComplete: () => void }) {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetch("/api/stories?limit=5")
      .then((r) => r.json())
      .then((d) => setStories(d.stories || []))
      .catch(() => {});
  }, []);

  const handleExplore = () => {
    fetch("/api/user/complete-onboarding", { method: "POST" }).catch(() => {});
    onComplete();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      padding: "60px 24px 80px",
      fontFamily: F,
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{
          fontSize: 24,
          fontWeight: 500,
          color: "#ffffff",
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}>
          Welcome to Tideline.
        </h1>
        <p style={{
          fontSize: 14,
          fontWeight: 300,
          color: "rgba(255, 255, 255, 0.7)",
          margin: "0 0 36px",
          lineHeight: 1.6,
        }}>
          Your first brief arrives tomorrow at 7am. In the meantime, here is what Tideline covers.
        </p>

        {/* Tracker chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
          {TRACKERS.map((t) => (
            <span key={t} style={{
              fontFamily: M,
              fontSize: 11,
              fontWeight: 500,
              color: TEAL,
              border: `1px solid ${TEAL}`,
              background: "transparent",
              padding: "4px 12px",
              borderRadius: 4,
              letterSpacing: "0.02em",
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* Recent stories */}
        {stories.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            {stories.map((s) => (
              <div key={s.id} style={{
                padding: "16px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#ffffff",
                  lineHeight: 1.4,
                  marginBottom: 4,
                  letterSpacing: "-0.01em",
                }}>
                  {s.title}
                </div>
                <div style={{
                  fontFamily: M,
                  fontSize: 11,
                  color: T4,
                  marginBottom: 6,
                }}>
                  {s.source_name}
                </div>
                {s.short_summary && (
                  <div style={{
                    fontSize: 13,
                    fontWeight: 300,
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 1.6,
                  }}>
                    {s.short_summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleExplore}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: F,
            fontSize: 14,
            fontWeight: 500,
            color: TEAL,
            padding: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Explore the platform &rarr;
        </button>
      </div>
    </div>
  );
}
