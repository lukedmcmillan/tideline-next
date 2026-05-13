import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Our Crawler — Tideline",
  description:
    "Tideline operates a research crawler that fetches publicly published material from ocean governance and policy sources. Learn how to identify it, contact us, or opt out.",
  alternates: { canonical: "https://thetideline.co/about-our-crawler" },
};

export default function AboutCrawlerPage() {
  const NAVY   = "#0B1628";
  const TEAL   = "#1D9E75";
  const BODY   = "#5F6368";
  const BORDER = "#DADCE0";
  const F      = "'DM Sans', sans-serif";

  const h1: React.CSSProperties = {
    fontFamily: F, fontSize: 32, fontWeight: 700, color: NAVY,
    margin: "0 0 12px", lineHeight: 1.2,
  };
  const lead: React.CSSProperties = {
    fontFamily: F, fontSize: 17, color: BODY, lineHeight: 1.7,
    margin: "0 0 48px", maxWidth: 620,
  };
  const h2: React.CSSProperties = {
    fontFamily: F, fontSize: 18, fontWeight: 700, color: NAVY,
    margin: "40px 0 12px", lineHeight: 1.3,
  };
  const p: React.CSSProperties = {
    fontFamily: F, fontSize: 15, color: BODY, lineHeight: 1.75,
    margin: "0 0 12px",
  };
  const ul: React.CSSProperties = {
    fontFamily: F, fontSize: 15, color: BODY, lineHeight: 1.75,
    margin: "0 0 12px", paddingLeft: 20,
  };
  const li: React.CSSProperties = { marginBottom: 6 };
  const codeBlock: React.CSSProperties = {
    background: "#F8F9FA", border: `1px solid ${BORDER}`, borderRadius: 6,
    padding: "14px 18px", fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13, color: NAVY, margin: "12px 0 24px", lineHeight: 1.6,
    wordBreak: "break-all",
  };
  const divider: React.CSSProperties = {
    border: "none", borderTop: `1px solid ${BORDER}`, margin: "48px 0",
  };
  const a: React.CSSProperties = {
    color: TEAL, textDecoration: "none",
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Header bar */}
      <div style={{ background: NAVY, padding: "0 48px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", height: 56 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              Tideline
            </span>
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 48px 96px" }}>
        <h1 style={h1}>About the Tideline Crawler</h1>
        <p style={lead}>
          Tideline operates a research crawler that fetches publicly published material
          from ocean governance and policy sources to support our subscription intelligence service.
        </p>

        <hr style={divider} />

        <h2 style={h2}>What we do</h2>
        <ul style={ul}>
          <li style={li}>Fetch publicly-available pages and documents from ocean governance bodies, research organizations, and news sources</li>
          <li style={li}>Store metadata (title, publication date, source) and full text or PDF in our research library</li>
          <li style={li}>Make this material searchable for Tideline subscribers</li>
          <li style={li}>Always link back to your original publication</li>
        </ul>

        <h2 style={h2}>What we don't do</h2>
        <ul style={ul}>
          <li style={li}>Bypass paywalls or authentication</li>
          <li style={li}>Republish your content as our own</li>
          <li style={li}>Ignore robots.txt directives</li>
          <li style={li}>Aggressively crawl — we rate-limit to 1 request per 5 seconds per domain by default</li>
        </ul>

        <hr style={divider} />

        <h2 style={h2}>Identification</h2>
        <p style={p}>Our crawler sends the following User-Agent string:</p>
        <div style={codeBlock}>
          Tideline/1.0 (+https://thetideline.co/about-our-crawler; research@thetideline.co)
        </div>
        <p style={p}>
          We also send <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>From: research@thetideline.co</code> and{" "}
          <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>X-Crawler-Contact: research@thetideline.co</code> headers
          with every request so your server logs can identify us without parsing the User-Agent string.
        </p>

        <hr style={divider} />

        <h2 style={h2}>How to opt out</h2>
        <ul style={ul}>
          <li style={li}>
            Add a Disallow directive in your robots.txt for{" "}
            <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>User-agent: Tideline</code>.
            We check robots.txt on every crawl and honor it automatically.
          </li>
          <li style={li}>
            Email{" "}
            <a href="mailto:research@thetideline.co" style={a}>research@thetideline.co</a>{" "}
            with the domain or URL pattern you want us to stop fetching.
            We honor explicit requests within 48 hours and durably.
          </li>
        </ul>

        <hr style={divider} />

        <h2 style={h2}>Contact</h2>
        <p style={p}>
          Research crawler inquiries:{" "}
          <a href="mailto:research@thetideline.co" style={a}>research@thetideline.co</a>
        </p>
        <p style={p}>
          General contact:{" "}
          <a href="mailto:hello@thetideline.co" style={a}>hello@thetideline.co</a>
        </p>
      </div>
    </div>
  );
}
