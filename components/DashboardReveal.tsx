"use client";

import { useEffect, useState } from "react";
import type { RevealData } from "@/app/lib/types/dashboard";

const TEAL_BRIGHT = "#27C893";
const TEAL = "#1D9E75";
const TEXT = "#E8EDF4";
const TEXT_DIM = "#5B6F8C";
const SANS = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

const DISMISS_KEY_PREFIX = "tideline_overnight_dismissed_";
const CACHE_FETCHED_KEY = "tideline_reveal_last_fetched";
const CACHE_DATA_KEY = "tideline_reveal_cache";

function todayKey(): string {
  const d = new Date();
  return `${DISMISS_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardReveal() {
  const [data, setData] = useState<RevealData | null>(null);
  const [dismissed, setDismissed] = useState(true); // hidden until check completes
  const [loading, setLoading] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [cachedMinutesAgo, setCachedMinutesAgo] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(todayKey())) {
      return; // dismissed stays true
    }
    setDismissed(false);

    // 2-minute reload guard: serve cached data to avoid stale "since" time
    const lastFetched = localStorage.getItem(CACHE_FETCHED_KEY);
    const minsAgo = lastFetched
      ? (Date.now() - Number(lastFetched)) / 60_000
      : Infinity;

    if (minsAgo < 2) {
      const cached = localStorage.getItem(CACHE_DATA_KEY);
      if (cached) {
        try {
          setData(JSON.parse(cached) as RevealData);
          setCacheHit(true);
          setCachedMinutesAgo(Math.floor(minsAgo));
          return;
        } catch {
          // fall through to fresh fetch
        }
      }
    }

    setLoading(true);
    fetch("/api/dashboard/reveal")
      .then(r => r.ok ? r.json() : null)
      .then((d: RevealData | null) => {
        if (d) {
          setData(d);
          localStorage.setItem(CACHE_FETCHED_KEY, String(Date.now()));
          localStorage.setItem(CACHE_DATA_KEY, JSON.stringify(d));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function dismiss() {
    localStorage.setItem(todayKey(), new Date().toISOString().split("T")[0]);
    setDismissed(true);
  }

  if (dismissed) return null;
  if (!loading && !data) return null;

  return (
    <>
      <style>{`
        @keyframes overnightSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0s !important; animation-iteration-count: 1 !important; }
        }
        @media (max-width: 768px) {
          .reveal-outer { margin: 16px 16px 0 !important; }
        }
      `}</style>
      <div className="reveal-outer" style={{
        margin: "20px 32px 0",
        padding: "18px 22px",
        background: "linear-gradient(135deg, rgba(29,158,117,0.08), rgba(29,158,117,0.02) 60%, transparent)",
        border: "1px solid rgba(29,158,117,0.25)",
        borderRadius: 12,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        animation: "overnightSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 240, height: "100%",
          background: "radial-gradient(circle at right, rgba(29,158,117,0.15), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Moon icon */}
        <div style={{
          width: 34, height: 34,
          background: "rgba(29,158,117,0.15)",
          border: "1px solid rgba(29,158,117,0.3)",
          borderRadius: 8,
          display: "grid", placeItems: "center",
          color: TEAL_BRIGHT,
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </div>

        {/* Body */}
        <div style={{ flex: 1, zIndex: 1 }}>
          {loading ? (
            <>
              <div style={{
                height: 10, width: 160, borderRadius: 4,
                background: "rgba(39,200,147,0.2)", marginBottom: 8,
                animation: "revealPulse 1.4s ease-in-out infinite",
              }} />
              <div style={{
                height: 14, width: "90%", borderRadius: 4,
                background: "rgba(232,237,244,0.08)", marginBottom: 6,
                animation: "revealPulse 1.4s ease-in-out infinite",
              }} />
              <div style={{
                height: 14, width: "65%", borderRadius: 4,
                background: "rgba(232,237,244,0.08)",
                animation: "revealPulse 1.4s ease-in-out infinite",
              }} />
            </>
          ) : data ? (
            <>
              <div style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: TEAL_BRIGHT,
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                {data.header}
              </div>
              <div style={{
                fontFamily: SANS,
                fontSize: 14.5,
                lineHeight: 1.55,
                color: TEXT,
              }}>
                {data.summary}
              </div>
              {cacheHit && (
                <div style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: TEXT_DIM,
                  marginTop: 5,
                  letterSpacing: "0.04em",
                }}>
                  updated {cachedMinutesAgo < 1 ? "just now" : `${cachedMinutesAgo} min ago`}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="mob-tap"
          style={{
            background: "none",
            border: "none",
            color: TEXT_DIM,
            fontFamily: SANS,
            fontSize: 12,
            cursor: "pointer",
            padding: "4px 8px",
            alignSelf: "flex-start",
          }}
        >
          Dismiss
        </button>
      </div>
    </>
  );
}
