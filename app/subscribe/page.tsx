"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!stripe || !elements) return;

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not loaded.");
      setSubmitting(false);
      return;
    }

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: { email },
    });

    if (pmError) {
      setError(pmError.message ?? "Card error.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, paymentMethodId: paymentMethod.id }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    // Handle SCA / 3D Secure
    if (data.clientSecret) {
      const { error: confirmError } = await stripe.confirmCardSetup(data.clientSecret);
      if (confirmError) {
        setError(confirmError.message ?? "Authentication failed.");
        setSubmitting(false);
        return;
      }
    }

    setSuccess(true);
    setSubmitting(false);
    window.location.href = "/platform/feed";
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>✓</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, fontFamily: SERIF, marginBottom: 12 }}>You&apos;re subscribed.</h2>
        <p style={{ fontSize: 15, color: MUTED, fontFamily: SANS }}>Redirecting to your feed...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER}`, fontSize: 15, fontFamily: SANS, borderRadius: 3, background: WHITE }}
        />
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 7, fontFamily: SANS }}>Most subscribers use their work email address.</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Card details
        </label>
        <div style={{ padding: "12px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 3, background: WHITE }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "15px",
                  fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
                  color: NAVY,
                  "::placeholder": { color: "#94a3b8" },
                },
                invalid: { color: "#ef4444" },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, fontFamily: SANS }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !stripe}
        style={{
          width: "100%",
          padding: "14px",
          background: submitting ? "#94a3b8" : BLUE,
          border: "none",
          color: WHITE,
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          borderRadius: 3,
          fontFamily: SANS,
        }}
      >
        {submitting ? "Processing..." : "Subscribe — £25/month"}
      </button>

      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, fontFamily: SANS, lineHeight: 1.6 }}>
        Your 14-day free trial starts today. You won&apos;t be charged until it ends. Cancel anytime.
      </p>
    </form>
  );
}

export default function SubscribePage() {
  return (
    <div style={{ minHeight: "100vh", background: OFF_WHITE, fontFamily: SANS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: ${BLUE} !important; box-shadow: 0 0 0 3px rgba(29,111,164,0.12); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 700, color: NAVY, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
        </div>

        <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, marginBottom: 12, fontFamily: SANS }}>Subscribe to Pro</div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: NAVY, margin: "0 0 14px", fontFamily: SERIF, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            Unlock full access.
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, fontFamily: SANS }}>
            All 55 intelligence topics, daily briefings, live regulatory trackers, and breaking alerts.
          </p>
        </div>

        {/* Plan summary */}
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "18px 20px", borderRadius: 3, marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>Tideline Professional</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, fontFamily: SANS }}>£25<span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/month</span></span>
          </div>
          <div style={{ fontSize: 13, color: MUTED, fontFamily: SANS }}>14-day free trial included</div>
        </div>

        {/* Stripe Elements */}
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href="/platform/feed" style={{ fontSize: 13, color: MUTED, fontFamily: SANS, textDecoration: "underline" }}>← Back to feed</a>
        </div>
      </div>
    </div>
  );
}
