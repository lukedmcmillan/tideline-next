"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ReserveForm() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push("/reserved");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!showForm) {
    return (
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(true)}
        style={{ width: "100%" }}
      >
        Reserve my founding place
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          autoFocus
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            fontSize: 15,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ whiteSpace: "nowrap" }}
        >
          {submitting ? "Reserving..." : "Reserve"}
        </button>
      </div>
      {/* Honeypot field - hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        onChange={() => {}}
      />
      {error && (
        <p style={{ color: "var(--red)", fontSize: 13, marginTop: 8 }}>{error}</p>
      )}
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
        One brief a day. Unsubscribe any time.{" "}
        <a href="/privacy" style={{ color: "var(--green)", fontWeight: 600 }}>
          Privacy policy
        </a>
        .
      </p>
    </form>
  );
}
