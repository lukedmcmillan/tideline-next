import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content and Data Policy | Tideline",
  description: "Where Tideline library content comes from, how we use it, and how we handle attribution and takedown requests.",
};

export default function ContentPolicyPage() {
  const F = "'DM Sans', sans-serif";
  const NAVY = "#0B1628";
  const TEAL = "#1D9E75";
  const TEXT = "#E8EDF4";
  const MUTED = "#8BA0BC";

  const section: React.CSSProperties = {
    fontFamily: F, fontSize: 20, fontWeight: 600, color: TEXT,
    margin: "48px 0 16px", lineHeight: 1.3,
  };
  const subsection: React.CSSProperties = {
    fontFamily: F, fontSize: 16, fontWeight: 600, color: TEAL,
    margin: "28px 0 10px", lineHeight: 1.3,
  };
  const body: React.CSSProperties = {
    fontFamily: F, fontSize: 15, color: TEXT, lineHeight: 1.75, margin: "0 0 16px",
  };
  const list: React.CSSProperties = {
    fontFamily: F, fontSize: 15, color: TEXT, lineHeight: 1.75, margin: "0 0 16px",
    paddingLeft: 20,
  };

  return (
    <div style={{ background: NAVY, minHeight: "100vh", fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Nav */}
      <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Tideline</span>
          </a>
          <a href="/platform/feed" style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: "none" }}>Back to platform</a>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 700, color: TEXT, lineHeight: 1.2, margin: "0 0 24px" }}>
          Content and Data Policy
        </h1>

        <p style={body}>
          Tideline is a professional ocean intelligence platform. We aggregate, curate, and analyse regulatory documents, scientific research, and policy reports so that professionals working in ocean governance, marine law, shipping compliance, conservation, and blue finance can stay informed without spending hours searching.
        </p>
        <p style={body}>
          This page explains where our library content comes from, how we use it, and how we handle attribution and takedown requests. We publish this because we believe professionals deserve to know how their intelligence tools work.
        </p>

        {/* What is in the Tideline Library */}
        <h2 style={section}>What is in the Tideline Library</h2>
        <p style={body}>The Tideline library contains three categories of document.</p>

        <h3 style={subsection}>Regulatory and Government Documents</h3>
        <p style={body}>
          Official publications from intergovernmental bodies and national governments, including the International Maritime Organisation, International Seabed Authority, OSPAR Commission, UN Food and Agriculture Organisation, Convention on Biological Diversity, International Whaling Commission, and others. These are collected under open government licences and UN document reproduction policies. Every document links back to its original source.
        </p>

        <h3 style={subsection}>Peer-Reviewed Research</h3>
        <p style={body}>
          Open access academic papers from marine science, ocean governance, fisheries, and related fields. We collect only papers published under Creative Commons Attribution licences (CC BY, CC BY-SA, or CC BY-ND). Papers published under non-commercial licences (CC BY-NC) are excluded. Papers are sourced via OpenAlex, a free and open academic database maintained by a non-profit, and related repositories including Europe PMC and Zenodo.
        </p>
        <p style={body}>
          Every paper in the library shows the authors, journal, publication year, DOI, and licence type.
        </p>

        <h3 style={subsection}>NGO and Policy Reports</h3>
        <p style={body}>
          Campaign reports, policy briefings, and technical papers from ocean-focused organisations including the Environmental Investigation Agency, Whale and Dolphin Conservation, Oceana, OceanCare, Surfers Against Sewage, WWF, IUCN, ClientEarth, and others. These are publicly available documents indexed for metadata and referenced by source link.
        </p>

        {/* How We Collect Content */}
        <h2 style={section}>How We Collect Content</h2>
        <p style={body}>
          Tideline uses automated collection agents that run nightly. These agents visit public-facing document pages and download metadata (title, author, date, topic) and, where available, PDF files. We do not access documents behind paywalls or authentication systems. We do not use services that provide unauthorised access to copyrighted works.
        </p>
        <p style={body}>
          Our collection is respectful of source servers: we use rate limiting and request delays to avoid placing excessive load on any source. We identify ourselves in our request headers so source operators can contact us.
        </p>

        {/* How We Use PDFs */}
        <h2 style={section}>How We Use PDFs</h2>
        <p style={body}>For documents in our library, we download and process PDF files for two purposes:</p>
        <ul style={list}>
          <li>Display: subscribers can read or download documents directly from the Tideline platform. Attribution is shown on every document.</li>
          <li>Workspace intelligence: PDFs are processed to generate searchable embeddings that power our workspace question-answering feature. This process, known as text and data mining, is permitted under Section 29A of the Copyright, Designs and Patents Act 1988 for computational analysis purposes.</li>
        </ul>
        <p style={body}>
          When the workspace cites a document in response to a subscriber query, it shows a short relevant passage alongside the author, organisation, year, and a link to the original source. We do not reproduce full documents in workspace answers.
        </p>

        {/* Attribution */}
        <h2 style={section}>Attribution</h2>
        <p style={body}>We take attribution seriously. Every document in the Tideline library displays:</p>
        <ul style={list}>
          <li>The original author or authoring organisation</li>
          <li>Publication date</li>
          <li>Source organisation or journal</li>
          <li>A link to the original source URL</li>
          <li>Licence type (for open access academic papers)</li>
        </ul>
        <p style={body}>
          This is both a legal requirement under Creative Commons licences and the right thing to do. The organisations and researchers whose work appears in our library are doing important work. We want subscribers to be able to follow citations back to the source.
        </p>

        {/* Takedown Requests */}
        <h2 style={section}>Takedown Requests</h2>
        <p style={body}>
          If you are a rights holder and believe your content has been collected in a way that is inconsistent with this policy or your rights, please contact us at <a href="mailto:legal@thetideline.co" style={{ color: TEAL, textDecoration: "none" }}>legal@thetideline.co</a>. We will acknowledge your request within 2 business days and act on valid requests within 5 business days.
        </p>
        <p style={body}>
          Please include in your request: the specific document or documents concerned, your interest in the content, and the basis on which you are requesting removal.
        </p>

        {/* Your Personal Data */}
        <h2 style={section}>Your Personal Data</h2>
        <p style={body}>
          Tideline is registered with the Information Commissioner&apos;s Office (ICO registration number C1908883) as a data controller. We process subscriber personal data (email address, payment details, usage data) to provide and improve the platform. Full details are in our Privacy Policy.
        </p>

        {/* Footer note */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, marginTop: 48 }}>
          <p style={{ fontFamily: F, fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            Tideline is operated by Luke McMillan (sole trader). ICO registration: C1908883. Last updated: April 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
