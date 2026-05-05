import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Hr,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type Band = "LOW" | "WATCH" | "ELEVATED" | "HIGH";

const BAND_ORDER: Record<Band, number> = { LOW: 0, WATCH: 1, ELEVATED: 2, HIGH: 3 };
const FONT =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

function bandColor(band: Band): string {
  if (band === "LOW") return "#E24B4A";
  if (band === "WATCH") return "#EF9F27";
  return "#1D9E75"; // ELEVATED + HIGH
}

export interface StoryBlock {
  sourceName: string;
  headline: string;
  summary: string;
  publishedAt: string;
}

export interface ThresholdAlertEmailProps {
  trackerName: string;
  prevBand: Band;
  newBand: Band;
  score: number;
  direction: "accelerating" | "stable" | "decelerating" | null;
  sparklineSvg: string;
  story: StoryBlock | null;
  interpretation: string;
  ctaUrl: string;
  trackedEntities: string[];
  preheaderText: string;
}

export function ThresholdAlertEmail({
  trackerName,
  prevBand,
  newBand,
  score,
  direction,
  sparklineSvg,
  story,
  interpretation,
  ctaUrl,
  trackedEntities,
  preheaderText,
}: ThresholdAlertEmailProps) {
  const color = bandColor(newBand);
  const isUp = BAND_ORDER[newBand] > BAND_ORDER[prevBand];
  const arrow = isUp ? "\u25B2" : "\u25BC"; // ▲ ▼ as unicode escapes
  // Downward arrow always red — the direction is the alarming signal,
  // independent of which band we landed in.
  const arrowColor = isUp ? color : "#E24B4A";

  const directionLabel =
    direction === "accelerating"
      ? "Accelerating"
      : direction === "decelerating"
        ? "Decelerating"
        : "Stable";

  return (
    <Html lang="en">
      <Head />
      <Preview>{preheaderText}</Preview>
      <Body
        style={{
          backgroundColor: "#0B1628",
          margin: "0",
          padding: "32px 0",
          fontFamily: FONT,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          {/* ── Card ── */}
          <Section
            style={{
              backgroundColor: "#0D1E35",
              borderRadius: "8px",
              padding: "32px",
            }}
          >
            {/* Opening line */}
            <Text
              style={{
                color: "#E8EDF4",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 28px",
                fontFamily: FONT,
              }}
            >
              The{" "}
              <strong style={{ color: "#E8EDF4" }}>{trackerName}</strong>{" "}
              Pulse Score just moved from{" "}
              <strong style={{ color: "#E8EDF4" }}>{prevBand}</strong> to{" "}
              <strong style={{ color: color }}>{newBand}</strong>.
            </Text>

            {/* ── Score block ── */}
            <Section
              style={{
                borderLeft: `3px solid ${color}`,
                paddingLeft: "16px",
                margin: "0 0 28px",
              }}
            >
              {/* Score + direction arrow */}
              <Text
                style={{
                  color: color,
                  fontSize: "52px",
                  lineHeight: "1",
                  margin: "0 0 4px",
                  fontFamily: FONT,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-1px",
                }}
              >
                {score.toFixed(1)}
                <span
                  style={{
                    fontSize: "22px",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                    color: arrowColor,
                  }}
                >
                  {arrow}
                </span>
              </Text>

              {/* Direction label */}
              <Text
                style={{
                  color: "#8BA0BC",
                  fontSize: "13px",
                  margin: "0 0 16px",
                  fontFamily: FONT,
                }}
              >
                {directionLabel}
              </Text>

              {/* Inline SVG sparkline — omit if empty */}
              {sparklineSvg && (
                <div
                  dangerouslySetInnerHTML={{ __html: sparklineSvg }}
                  style={{ lineHeight: "0" }}
                />
              )}
            </Section>

            <Hr
              style={{
                borderColor: "#1A2D45",
                borderTopWidth: "1px",
                margin: "0 0 28px",
              }}
            />

            {/* ── Most recent story — omit entirely if null ── */}
            {story && (
              <>
                <Text
                  style={{
                    color: "#8BA0BC",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    margin: "0 0 6px",
                    fontFamily: FONT,
                  }}
                >
                  {story.sourceName}
                </Text>
                <Text
                  style={{
                    color: "#E8EDF4",
                    fontSize: "15px",
                    fontWeight: "700",
                    lineHeight: "22px",
                    margin: "0 0 6px",
                    fontFamily: FONT,
                  }}
                >
                  {story.headline}
                </Text>
                <Text
                  style={{
                    color: "#8BA0BC",
                    fontSize: "14px",
                    lineHeight: "21px",
                    margin: "0 0 6px",
                    fontFamily: FONT,
                  }}
                >
                  {story.summary}
                </Text>
                <Text
                  style={{
                    color: "#8BA0BC",
                    fontSize: "12px",
                    margin: "0 0 28px",
                    fontFamily: FONT,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {story.publishedAt}
                </Text>
                <Hr
                  style={{
                    borderColor: "#1A2D45",
                    borderTopWidth: "1px",
                    margin: "0 0 28px",
                  }}
                />
              </>
            )}

            {/* ── Interpretation ── */}
            <Text
              style={{
                color: "#8BA0BC",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                margin: "0 0 8px",
                fontFamily: FONT,
              }}
            >
              What this means
            </Text>
            <Text
              style={{
                color: "#E8EDF4",
                fontSize: "15px",
                lineHeight: "24px",
                margin: "0 0 32px",
                fontFamily: FONT,
              }}
            >
              {interpretation}
            </Text>

            {/* ── CTA button ── */}
            <table
              role="presentation"
              style={{ borderCollapse: "collapse" as const, width: "100%" }}
            >
              <tbody>
                <tr>
                  <td align="center">
                    <Link
                      href={ctaUrl}
                      style={{
                        display: "inline-block",
                        backgroundColor: "#1D9E75",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: "600",
                        textDecoration: "none",
                        borderRadius: "6px",
                        padding: "14px 32px",
                        fontFamily: FONT,
                      }}
                    >
                      Open the Pulse dashboard
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* ── Footer ── */}
          <Section style={{ padding: "20px 8px 0" }}>
            <Text
              style={{
                color: "#8BA0BC",
                fontSize: "13px",
                lineHeight: "20px",
                textAlign: "center" as const,
                margin: "0",
                fontFamily: FONT,
              }}
            >
              You are getting this because you track{" "}
              {trackedEntities.join(", ")}.{" "}
              <Link
                href="https://thetideline.co/platform/settings/alerts"
                style={{
                  color: "#8BA0BC",
                  textDecoration: "underline",
                  fontFamily: FONT,
                }}
              >
                Manage alerts
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
