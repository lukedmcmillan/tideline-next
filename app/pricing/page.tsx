"use client";

import { useState, useEffect } from "react";
import EarlyAccessModal from "@/components/EarlyAccessModal";

const TEAL = "#1D9E75";

const tiers = [
  {
    id: "founding",
    name: "Founding Member",
    badge: "Price locks on joining",
    price: "£39",
    interval: "/month",
    altPrice: null,
    description:
      "Full platform access at the price that reflects where Tideline is now. Not a discount. An identity.",
    extra:
      "Founding members get the price, the access, and the ear of the person building it.",
    features: [
      "Live feed (100+ sources)",
      "10 live regulatory trackers",
      "Workspace with research library",
      "Generate Report to Word or PDF",
      "Regulatory deadline calendar",
    ],
    cta: "Join as founding member",
    tier: "founding",
    outlined: false,
    href: null,
    highlighted: true,
  },
  {
    id: "individual",
    name: "Individual",
    badge: null,
    price: "£99",
    interval: "/month",
    altPrice: "or £990/year (two months free)",
    description:
      "For the professional who needs to know what moved, produce the work, and stay ahead of everyone else.",
    extra: null,
    features: [
      "Everything in Founding Member",
      "Crosscurrent: connections across sources identified automatically",
      "Regulatory deadline calendar",
      "Unlimited research queries",
      "Priority support",
    ],
    cta: "Start 7-day free trial",
    tier: "individual",
    outlined: false,
    href: null,
    highlighted: false,
  },
  {
    id: "team",
    name: "Team",
    badge: null,
    price: "£699",
    interval: "/month",
    altPrice: null,
    description:
      "For organisations where ocean intelligence needs to be shared and built into institutional memory.",
    extra: null,
    features: [
      "Everything in Individual",
      "10 seats with shared workspace",
      "Institutional memory stays when people leave",
      "Reports with full provenance trail",
      "Priority support",
    ],
    cta: "Talk to us",
    tier: "team",
    outlined: true,
    href: "mailto:luke@thetideline.co",
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<{
    status: string;
    trialEnd: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/subscription-status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  const checkout = async (tier: string) => {
    setLoading(tier);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (r.status === 401) {
        setLoading(null);
        setShowModal(true);
        return;
      }
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else setLoading(null);
    } catch {
      setLoading(null);
    }
  };

  const statusMessage = (() => {
    if (!status) return null;
    if (status.status === "active") return "Your subscription is active.";
    if (status.status === "trialing" && status.trialEnd) {
      const days = Math.ceil(
        (new Date(status.trialEnd).getTime() - Date.now()) / 86400000,
      );
      return `You are on a free trial with ${days} day${days !== 1 ? "s" : ""} remaining.`;
    }
    return null;
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FA",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "60px 24px",
        }}
      >
        {statusMessage && (
          <div
            style={{
              background: "#E6F4F1",
              border: `1px solid ${TEAL}`,
              borderRadius: 8,
              padding: "12px 20px",
              marginBottom: 32,
              fontSize: 14,
              color: "#202124",
            }}
          >
            {statusMessage}
          </div>
        )}

        <h1
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 28,
            color: "#202124",
            margin: "0 0 12px 0",
            lineHeight: 1.3,
          }}
        >
          Join as a founding member. Your price is locked for life.
        </h1>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: "#5F6368",
            margin: "0 0 48px 0",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          The platform is live and growing week by week. Founding members join
          now at £39/month, locked for life. The price increases when Tideline
          leaves beta. It never increases for you.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {tiers.map((t) => (
            <div
              key={t.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: t.highlighted
                  ? `2px solid ${TEAL}`
                  : "1px solid #E8EAED",
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {t.badge && (
                <div
                  style={{
                    display: "inline-block",
                    background: TEAL,
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 4,
                    marginBottom: 16,
                    alignSelf: "flex-start",
                    letterSpacing: "0.02em",
                  }}
                >
                  {t.badge}
                </div>
              )}

              <h2
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#202124",
                  margin: t.badge ? "0 0 16px 0" : "0 0 16px 0",
                }}
              >
                {t.name}
              </h2>

              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 36,
                    color: "#202124",
                  }}
                >
                  {t.price}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 15,
                    color: "#5F6368",
                  }}
                >
                  {t.interval}
                </span>
              </div>

              {t.altPrice && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: TEAL,
                    fontWeight: 500,
                    margin: "-8px 0 16px 0",
                  }}
                >
                  {t.altPrice}
                </p>
              )}

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: "#5F6368",
                  lineHeight: 1.6,
                  margin: "0 0 8px 0",
                }}
              >
                {t.description}
              </p>

              {t.extra && (
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#202124",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    margin: "0 0 20px 0",
                  }}
                >
                  {t.extra}
                </p>
              )}

              {!t.extra && <div style={{ marginBottom: 12 }} />}

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 auto 0",
                }}
              >
                {t.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: "#202124",
                      padding: "6px 0",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: TEAL,
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: "20px",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 28 }}>
                {t.href ? (
                  <a
                    href={t.href}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "12px 24px",
                      borderRadius: 6,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      border: `2px solid ${TEAL}`,
                      background: "transparent",
                      color: TEAL,
                      cursor: "pointer",
                    }}
                  >
                    {t.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => checkout(t.tier)}
                    disabled={loading === t.tier}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 24px",
                      borderRadius: 6,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      border: "none",
                      background: TEAL,
                      color: "#FFFFFF",
                      cursor: loading === t.tier ? "wait" : "pointer",
                      opacity: loading === t.tier ? 0.7 : 1,
                    }}
                  >
                    {loading === t.tier ? "Redirecting..." : t.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#5F6368",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          7 days free, no card required. Cancel any time.
        </p>
      </div>

      {showModal && <EarlyAccessModal onClose={() => setShowModal(false)} />}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
