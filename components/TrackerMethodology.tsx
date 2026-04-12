"use client";

import { INST_TYPE, PREP_HORIZON, DISCLOSURE, alertBand, bandColor, interpretationSentence } from "@/app/lib/tracker-metadata";

const F = "'DM Sans',system-ui,sans-serif";

export default function TrackerMethodology({ slug, score, momentum }: { slug: string; score?: number; momentum?: "up" | "flat" | "dn" }) {
  const inst = INST_TYPE[slug];
  const prep = PREP_HORIZON[slug];
  const s = score ?? 0;
  const mom = momentum ?? "flat";
  const band = alertBand(s, slug);
  const bc = bandColor(band);
  const interp = interpretationSentence(slug, s, mom);

  return (
    <>
      {/* Interpretation callout */}
      {score != null && (
        <div style={{ background: "#F8F9FA", border: "0.5px solid #DADCE0", borderLeft: `3px solid ${bc}`, borderRadius: 4, padding: "10px 14px", fontSize: 12, color: "#3C4043", fontStyle: "italic", marginBottom: 16, fontFamily: F }}>
          {interp}
        </div>
      )}

      {/* Institutional type + alert band + prep horizon */}
      {inst && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 10, color: "#9AA0A6" }}>
            {inst.type} {"\u00B7"} {inst.label} {"\u00B7"} Risk multiplier {inst.multiplier}
            {score != null && (
              <span style={{ marginLeft: 12, fontWeight: 600, color: bc }}>{band}</span>
            )}
          </div>
          {prep && <div style={{ fontFamily: F, fontSize: 10, color: "#9AA0A6", marginTop: 4 }}>Typical preparation window: {prep}</div>}
          {inst.warning && (
            <div style={{ fontFamily: F, background: "rgba(239,159,39,.08)", border: "1px solid rgba(239,159,39,.2)", borderRadius: 4, padding: "6px 10px", fontSize: 10, color: "#EF9F27", marginTop: 8 }}>
              {inst.warning}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function TrackerDisclosure() {
  return (
    <div style={{ borderTop: "0.5px solid #DADCE0", padding: "10px 24px", fontSize: 10, color: "#9AA0A6", background: "#F8F9FA", marginTop: 32, fontFamily: F }}>
      {DISCLOSURE}
    </div>
  );
}
