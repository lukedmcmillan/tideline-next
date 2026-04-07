"use client";

import { useState } from "react";

const WHITE = "#FFFFFF";
const TEAL = "#1D9E75";
const T1 = "#202124";
const T3 = "#5F6368";
const T4 = "#9AA0A6";
const BD = "#DADCE0";
const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";

interface Tier {
  id: "founding" | "individual" | "team";
  badge: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  action: "checkout" | "mailto";
  href?: string;
}

const TIERS: Tier[] = [
  {
    id: "founding",
    badge: "Limited",
    name: "Founding member",
    price: "£39",
    period: "per month",
    tagline: "Locked for life. Closes when beta ends.",
    cta: "Claim your spot",
    action: "checkout",
  },
  {
    id: "individual",
    badge: "Standard",
    name: "Individual",
    price: "£99",
    period: "per month",
    tagline: "Full access. Cancel anytime.",
    cta: "Start subscription",
    action: "checkout",
  },
  {
    id: "team",
    badge: "Teams",
    name: "Team",
    price: "£699",
    period: "per month (10 seats)",
    tagline: "For NGOs and corporate teams.",
    cta: "Talk to us",
    action: "mailto",
    href: "mailto:luke@thetideline.co",
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (tierId: string) => {
    setLoading(tierId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: WHITE, fontFamily: F, padding: "64px 24px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEAL, marginBottom: 12 }}>
            Choose your plan
          </div>
          <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: T1, letterSpacing: "-0.5px", margin: "0 0 12px" }}>
            Upgrade to Tideline
          </h1>
          <p style={{ fontFamily: F, fontSize: 14, color: T3, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Professional ocean intelligence, delivered daily. Pick the plan that fits how you work.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TIERS.map((tier) => {
            const isLoading = loading === tier.id;
            return (
              <div
                key={tier.id}
                style={{
                  background: WHITE,
                  border: `1px solid ${BD}`,
                  borderRadius: 12,
                  padding: "24px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: M, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T4, marginBottom: 6 }}>
                    {tier.badge}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: T1, letterSpacing: "-0.2px", marginBottom: 4 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 13, color: T3, lineHeight: 1.5 }}>
                    {tier.tagline}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: F, fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.3px" }}>
                    {tier.price}
                  </div>
                  <div style={{ fontFamily: M, fontSize: 10, color: T4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {tier.period}
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {tier.action === "mailto" ? (
                    <a
                      href={tier.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 40,
                        padding: "0 20px",
                        fontFamily: F,
                        fontSize: 13,
                        fontWeight: 600,
                        color: WHITE,
                        background: TEAL,
                        border: "none",
                        borderRadius: 7,
                        textDecoration: "none",
                      }}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCheckout(tier.id)}
                      disabled={isLoading}
                      style={{
                        height: 40,
                        padding: "0 20px",
                        fontFamily: F,
                        fontSize: 13,
                        fontWeight: 600,
                        color: WHITE,
                        background: TEAL,
                        border: "none",
                        borderRadius: 7,
                        cursor: isLoading ? "default" : "pointer",
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      {isLoading ? "Loading..." : tier.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, padding: "16px 20px", background: "#F8F9FA", border: `1px solid ${BD}`, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontFamily: F, fontSize: 13, color: T3, lineHeight: 1.6 }}>
            NGO or academic institution? 50% discount available. Email{" "}
            <a href="mailto:luke@thetideline.co" style={{ color: TEAL, fontWeight: 500, textDecoration: "none" }}>
              luke@thetideline.co
            </a>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ fontFamily: M, fontSize: 10, color: T4, letterSpacing: "0.04em" }}>
            Secure payment via Stripe. Cancel anytime.
          </div>
        </div>
      </div>
    </div>
  );
}
