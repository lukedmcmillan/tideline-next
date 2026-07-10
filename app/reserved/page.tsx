import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Place reserved \u00b7 Tideline",
};

export default function ReservedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF9F5",
        fontFamily: "'DM Sans', sans-serif",
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          textAlign: "center",
          background: "#fff",
          border: "1px solid #E7E5DC",
          borderRadius: 16,
          padding: "56px 40px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#149A73",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 20,
          }}
        >
          &#10003;
        </div>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: "#15201B",
            marginBottom: 14,
          }}
        >
          Your founding place is reserved.
        </h1>
        <p style={{ fontSize: 17, color: "#42504A", lineHeight: 1.6, marginBottom: 16 }}>
          Check your email for confirmation. You have 7 days to activate your account and start your first brief.
        </p>
        <p style={{ fontSize: 14, color: "#6E7C75" }}>
          Questions? Reply to the email or write to{" "}
          <a href="mailto:luke@thetideline.co" style={{ color: "#149A73", fontWeight: 600 }}>
            luke@thetideline.co
          </a>
        </p>
      </div>
    </div>
  );
}
