"use client";

import DesktopOnly from "@/components/DesktopOnly";

const SERIF = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS  = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";

export default function LibraryPage() {
  return (
    <DesktopOnly featureName="Library">
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 28px" }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", fontWeight: 400, opacity: 0.5, margin: "0 0 8px" }}>Your library is empty.</h1>
      <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.7, opacity: 0.45, margin: 0 }}>
        Save any story from the feed using the bookmark icon. Saved stories appear here, with your notes and tags, organised however you need them.
      </p>
    </div>
    </DesktopOnly>
  );
}
