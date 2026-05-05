/**
 * buildSparkline — server-side inline SVG sparkline for email.
 *
 * Scores are on the 0–10 velocity scale. Returns an inline SVG string
 * ready to embed directly in email HTML. No external images, no JS.
 * Shape only: no axes, no labels, no grid.
 *
 * @param scores  Array of numeric scores (0–10). Minimum 2 values required.
 * @param color   Hex colour string for the stroke (e.g. "#1D9E75").
 */
export function buildSparkline(scores: number[], color: string): string {
  if (scores.length < 2) return "";

  const W = 200;
  const H = 40;
  const PAD_Y = 4; // vertical padding so stroke doesn't clip at edge

  const n = scores.length;
  const MIN_SCORE = 0;
  const MAX_SCORE = 10;

  const points = scores.map((s, i) => {
    const x = (i / (n - 1)) * W;
    // Invert y: high score → low y value (top of SVG)
    const y =
      H - PAD_Y - ((s - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * (H - PAD_Y * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const d = `M ${points.join(" L ")}`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" ` +
    `style="display:block;overflow:visible">` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" ` +
    `stroke-linejoin="round" stroke-linecap="round"/>` +
    `</svg>`
  );
}
