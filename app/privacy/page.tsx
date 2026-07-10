import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy \u00b7 Tideline",
};

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF9F5",
        fontFamily: "'DM Sans', sans-serif",
        color: "#42504A",
        fontSize: 16,
        lineHeight: 1.7,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 32px" }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 32,
            color: "#15201B",
            marginBottom: 8,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: "#6E7C75", marginBottom: 40 }}>Last updated: July 2026</p>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>What we collect</h2>
        <p style={{ marginBottom: 16 }}>When you reserve a founding place or create an account, we collect your <strong style={{ color: "#15201B" }}>email address</strong>. That is the only personal data we require.</p>
        <p style={{ marginBottom: 16 }}>If you subscribe, Stripe processes your payment details. We do not store card numbers.</p>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>How we use it</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={{ marginBottom: 8 }}>To send your daily morning brief and threshold alerts</li>
          <li style={{ marginBottom: 8 }}>To manage your account and subscription</li>
          <li style={{ marginBottom: 8 }}>To respond to your questions and feedback</li>
        </ul>
        <p style={{ marginBottom: 16 }}>We do not sell, rent, or share your data with third parties for marketing.</p>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>Who processes it</h2>
        <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
          <li style={{ marginBottom: 8 }}><strong style={{ color: "#15201B" }}>Supabase</strong> (database hosting, EU region)</li>
          <li style={{ marginBottom: 8 }}><strong style={{ color: "#15201B" }}>Resend</strong> (email delivery)</li>
          <li style={{ marginBottom: 8 }}><strong style={{ color: "#15201B" }}>Stripe</strong> (payment processing)</li>
          <li style={{ marginBottom: 8 }}><strong style={{ color: "#15201B" }}>Vercel</strong> (application hosting)</li>
        </ul>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>Unsubscribe</h2>
        <p style={{ marginBottom: 16 }}>Every email includes a one-click unsubscribe link. You can also update your preferences from your account settings at any time.</p>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>Data retention</h2>
        <p style={{ marginBottom: 16 }}>We keep your account data for as long as your account is active. If you cancel, we delete your personal data within 30 days. Anonymised usage data may be retained for product improvement.</p>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: "#15201B", marginTop: 36, marginBottom: 12 }}>Contact</h2>
        <p style={{ marginBottom: 16 }}>
          For any privacy questions or data requests, email{" "}
          <a href="mailto:luke@thetideline.co" style={{ color: "#149A73", fontWeight: 600 }}>luke@thetideline.co</a>.
        </p>

        <div style={{ borderTop: "1px solid #E7E5DC", marginTop: 48, paddingTop: 24, fontSize: 14, color: "#6E7C75" }}>
          Tideline Ocean Intelligence Ltd. This policy will be updated before public launch.
        </div>
      </div>
    </div>
  );
}
