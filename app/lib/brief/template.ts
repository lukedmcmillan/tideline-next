// app/lib/brief/template.ts
// Mobile-first email template for Tideline morning brief.
// Pure renderer: no async, no DB, no AI. Takes BriefData + BriefUser, returns HTML string.

// ── Font stacks ──────────────────────────────────────────────────────────────
const SYS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`;

// ── Color palette ─────────────────────────────────────────────────────────────
const CLR = {
  bg:           '#FAFAF7',
  surface:      '#FFFFFF',
  teal:         '#1D9E75',
  tealSoft:     '#EFF7F3',
  amber:        '#EF9F27',
  grey:         '#6B7A8E',
  textPrimary:  '#0A1628',
  textBody:     '#2C3848',
  textSecondary:'#4A5568',
  textMuted:    '#6B7A8E',
  border:       '#D8D5CC',
  borderAlt:    '#E3E0D6',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type BandLabel     = 'ELEVATED' | 'WATCH' | 'LOW';
export type EvidenceColor = 'teal' | 'amber' | 'grey';
export type Weekday       = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

/** A lead backed by a real story with a link. */
export interface LeadStory {
  type:           'story';
  headline:       string;
  storyId:        string;
  interpretation: string; // 2-3 sentences, no em dashes
}

/** A lead synthesised from tracker state when no story crosses threshold. */
export interface LeadStateStatement {
  type:            'state';
  headline:        string;         // e.g. 'IMO Shipping at Pulse 7.5. MSC 109 in 11 days.'
  subjectHeadline?: string;        // short story title for email subject (Mode b only)
  storyId?:        string;         // anchored story ID for evidence dedup (Mode b only)
  interpretation:  string;
}

export type LeadItem = LeadStory | LeadStateStatement;

/** One row in the CONDITIONS section. */
export interface ConditionRow {
  trackerLabel:    string;        // display name, e.g. 'IMO Shipping'
  score:           number;        // 0-10 pulse score
  band:            BandLabel;
  sparklineValues: number[];      // 12-week raw scores for sparkline rendering
  interpretation?: string | null; // one-line plain-language explanation of score
}

/** One item in THE EVIDENCE section. */
export interface EvidenceItem {
  headline: string;
  body:     string;
  color:    EvidenceColor; // left-border colour
  storyId?: string;        // if set, headline is a link
}

/** One row in WHAT TO WATCH. */
export interface WatchEvent {
  dayLabel:    string;  // e.g. 'MON 5' or 'TUE 13'
  description: string;
  isNear:      boolean; // within 7 days: teal label; else muted
}

/** One story in ACROSS THE SECTOR. */
export interface AcrossSectorItem {
  headline:    string;
  storyId:     string;
  sourceLabel: string;
  body:        string;
}

/** All content data for one brief render. */
export interface BriefData {
  dateStr:         string;              // e.g. 'Tuesday, 5 May 2026'
  preheader:       string;              // up to 90 chars, shown in inbox preview
  lead:            LeadItem;
  conditions:      ConditionRow[];      // 0-2 shown; empty = section hidden
  evidence:        EvidenceItem[];      // 0-3 shown; empty = section hidden
  whatToWatch:     WatchEvent[];        // 0-3 shown; empty = section hidden
  acrossSector:    AcrossSectorItem | null;
  quickAsk:        string;              // pre-selected ask copy
  workRevealedLine:string;              // static or dynamic work-revealed sentence
  signOff:         string;              // day-aware sign-off copy
}

/** Per-user data needed for personalisation. */
export interface BriefUser {
  email:            string;
  unsubscribeToken: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bandColor(band: BandLabel): string {
  if (band === 'ELEVATED') return CLR.teal;
  if (band === 'WATCH')    return CLR.amber;
  return CLR.grey;
}

function evidenceBorderColor(color: EvidenceColor): string {
  if (color === 'teal')  return CLR.teal;
  if (color === 'amber') return CLR.amber;
  return CLR.grey;
}

/** Inline SVG sparkline. 48x14 viewBox, 1.5 stroke-width, normalised to data range. */
function sparkline(values: number[], color: string): string {
  if (values.length < 2) return '';
  const W = 48, H = 14, pad = 1.5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = (H - pad) - ((v - min) / range) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    `<svg width="48" height="14" viewBox="0 0 48 14" ` +
    `xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">` +
    `<polyline points="${pts}" fill="none" stroke="${color}" ` +
    `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

function sectionLabel(text: string, color: string = CLR.textMuted): string {
  return (
    `<div style="font-family:${SYS};font-size:9.5px;font-weight:700;` +
    `color:${color};letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;">` +
    `${text}</div>`
  );
}

// ── Section renderers ─────────────────────────────────────────────────────────
// Each returns '' when there is nothing to render (no orphan whitespace).

function renderPreheader(text: string): string {
  const safe = text.slice(0, 90);
  return (
    `<div style="display:none;font-size:1px;color:${CLR.bg};line-height:1px;` +
    `max-height:0;max-width:0;opacity:0;overflow:hidden;">${safe}</div>`
  );
}

function renderMasthead(dateStr: string): string {
  return `<tr><td style="padding:20px 18px 16px;border-bottom:0.5px solid ${CLR.border};">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;">
        <div style="font-family:${SYS};font-size:21px;font-weight:700;color:${CLR.textPrimary};letter-spacing:-0.03em;">Tideline</div>
        <div style="font-family:${SYS};font-size:8.5px;font-weight:700;color:${CLR.teal};letter-spacing:0.22em;text-transform:uppercase;margin-top:2px;">OCEAN INTELLIGENCE</div>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <span style="font-family:${MONO};font-size:11px;color:${CLR.textMuted};">${dateStr}</span>
      </td>
    </tr></table>
  </td></tr>`;
}

function renderLead(lead: LeadItem): string {
  const url = lead.type === 'story'
    ? `https://www.thetideline.co/platform/story/${lead.storyId}`
    : 'https://www.thetideline.co/platform/feed';
  const headlineEl = lead.type === 'story'
    ? `<a href="${url}" style="font-family:${SYS};font-size:19px;font-weight:700;color:${CLR.textPrimary};text-decoration:none;line-height:1.3;display:block;">${lead.headline}</a>`
    : `<div style="font-family:${SYS};font-size:19px;font-weight:700;color:${CLR.textPrimary};line-height:1.3;">${lead.headline}</div>`;
  return `<tr><td style="padding:20px 18px 16px;">
    ${sectionLabel('THE LEAD', CLR.teal)}
    ${headlineEl}
    <p style="font-family:${SYS};font-size:14px;color:${CLR.textBody};line-height:1.65;margin:10px 0 0;">${lead.interpretation}</p>
  </td></tr>`;
}

function renderConditions(conditions: ConditionRow[]): string {
  if (conditions.length === 0) return '';
  const rows = conditions.slice(0, 2).map(c => {
    const col    = bandColor(c.band);
    const svg    = sparkline(c.sparklineValues, col);
    const interp = c.interpretation
      ? `\n    <tr><td colspan="2" style="font-family:${SYS};font-size:11px;color:${CLR.textMuted};padding:0 0 6px;line-height:1.4;">${c.interpretation}</td></tr>`
      : '';
    return `<tr>
      <td style="font-family:${SYS};font-size:12px;font-weight:600;color:${CLR.textPrimary};padding:5px 0;vertical-align:middle;">${c.trackerLabel}</td>
      <td style="text-align:right;vertical-align:middle;padding:5px 0;white-space:nowrap;">
        <span style="display:inline-block;margin-right:8px;vertical-align:middle;">${svg}</span>
        <span style="font-family:${MONO};font-size:15px;font-weight:700;color:${col};vertical-align:middle;margin-right:5px;">${c.score.toFixed(1)}</span>
        <span style="font-family:${SYS};font-size:9px;font-weight:700;color:${col};letter-spacing:0.1em;text-transform:uppercase;vertical-align:middle;">${c.band}</span>
      </td>
    </tr>${interp}`;
  }).join('');
  return `<tr><td style="padding:14px 18px 10px;border-top:0.5px solid ${CLR.border};border-bottom:0.5px solid ${CLR.border};">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td colspan="2">${sectionLabel('CONDITIONS')}</td></tr>
      ${rows}
    </table>
    <div style="text-align:right;margin-top:6px;">
      <span style="font-family:${MONO};font-size:8.5px;color:${CLR.textMuted};">tideline.co</span>
    </div>
  </td></tr>`;
}

function renderEvidence(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) return '';
  const items = evidence.slice(0, 3).map((e, i) => {
    const col   = evidenceBorderColor(e.color);
    const isLast = i === Math.min(evidence.length, 3) - 1;
    const pb     = isLast ? '0' : '10px';
    const headEl = e.storyId
      ? `<a href="https://www.thetideline.co/platform/story/${e.storyId}" style="font-family:${SYS};font-size:13px;font-weight:600;color:${CLR.textPrimary};text-decoration:none;display:block;margin-bottom:3px;">${e.headline}</a>`
      : `<div style="font-family:${SYS};font-size:13px;font-weight:600;color:${CLR.textPrimary};margin-bottom:3px;">${e.headline}</div>`;
    return `<tr><td style="padding-bottom:${pb};">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="3" style="background:${col};vertical-align:top;"></td>
        <td style="padding-left:12px;">
          ${headEl}
          <p style="font-family:${SYS};font-size:12.5px;color:${CLR.textSecondary};line-height:1.6;margin:0;">${e.body}</p>
        </td>
      </tr></table>
    </td></tr>`;
  }).join('');
  return `<tr><td style="padding:14px 18px 12px;border-top:0.5px solid ${CLR.border};">
    ${sectionLabel('THE EVIDENCE')}
    <table width="100%" cellpadding="0" cellspacing="0">${items}</table>
  </td></tr>`;
}

function renderWhatToWatch(events: WatchEvent[]): string {
  if (events.length === 0) return '';
  const rows = events.slice(0, 3).map(e => {
    const labelColor = e.isNear ? CLR.teal : CLR.textMuted;
    return `<tr>
      <td style="font-family:${MONO};font-size:11px;color:${labelColor};white-space:nowrap;padding:4px 14px 4px 0;vertical-align:top;">${e.dayLabel}</td>
      <td style="font-family:${SYS};font-size:13px;color:${CLR.textBody};line-height:1.5;padding:4px 0;vertical-align:top;">${e.description}</td>
    </tr>`;
  }).join('');
  return `<tr><td style="padding:14px 18px 12px;border-top:0.5px solid ${CLR.border};">
    ${sectionLabel('WHAT TO WATCH')}
    <table cellpadding="0" cellspacing="0">${rows}</table>
  </td></tr>`;
}

function renderAcrossSector(item: AcrossSectorItem | null): string {
  if (!item) return '';
  return `<tr><td style="padding:14px 18px 12px;border-top:0.5px solid ${CLR.border};">
    ${sectionLabel('ACROSS THE SECTOR')}
    <a href="https://www.thetideline.co/platform/story/${item.storyId}" style="font-family:${SYS};font-size:13px;font-weight:600;color:${CLR.textPrimary};text-decoration:none;display:block;margin-bottom:4px;">${item.headline}</a>
    <div style="font-family:${SYS};font-size:10px;font-weight:600;color:${CLR.textMuted};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px;">${item.sourceLabel}</div>
    <p style="font-family:${SYS};font-size:12.5px;color:${CLR.textSecondary};line-height:1.6;margin:0;">${item.body}</p>
  </td></tr>`;
}

function renderQuickAsk(copy: string): string {
  return `<tr><td style="padding:14px 18px;border-top:0.5px solid ${CLR.border};">
    <div style="background:${CLR.tealSoft};border-left:3px solid ${CLR.teal};padding:12px 14px;border-radius:0 4px 4px 0;">
      <div style="font-family:${SYS};font-size:12px;font-weight:700;color:${CLR.teal};margin-bottom:5px;">Quick ask</div>
      <p style="font-family:${SYS};font-size:13px;color:${CLR.textBody};line-height:1.6;margin:0;">${copy}</p>
    </div>
  </td></tr>`;
}

function renderWorkRevealed(line: string): string {
  return `<tr><td style="padding:10px 18px;border-top:0.5px solid ${CLR.border};border-bottom:0.5px solid ${CLR.border};">
    <p style="font-family:${SYS};font-size:11px;font-style:italic;color:${CLR.textMuted};line-height:1.6;margin:0;">${line}</p>
  </td></tr>`;
}

function renderSignOff(signOff: string): string {
  return `<tr><td style="padding:16px 18px 14px;">
    <p style="font-family:${SYS};font-size:13.5px;color:${CLR.textBody};line-height:1.7;margin:0 0 14px;">${signOff}</p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;padding-right:10px;">
        <div style="width:32px;height:32px;border-radius:50%;background:${CLR.teal};text-align:center;line-height:32px;display:inline-block;">
          <span style="font-family:${SYS};font-size:14px;font-weight:700;color:#ffffff;">L</span>
        </div>
      </td>
      <td style="vertical-align:middle;">
        <div style="font-family:${SYS};font-size:13px;font-weight:700;color:${CLR.textPrimary};line-height:1.3;">Luke</div>
        <div style="font-family:${SYS};font-size:11.5px;color:${CLR.textMuted};">Founder, Tideline</div>
      </td>
    </tr></table>
  </td></tr>`;
}

function renderCTAs(): string {
  return `<tr><td style="padding:0 18px 18px;">
    <a href="https://www.thetideline.co/platform/feed"
       style="display:block;background:${CLR.teal};color:#ffffff;font-family:${SYS};font-size:14px;font-weight:600;text-decoration:none;text-align:center;padding:13px 12px;border-radius:6px;min-height:44px;box-sizing:border-box;margin-bottom:8px;">
      Open feed in Tideline &#8594;
    </a>
    <a href="mailto:brief-replies@thetideline.co"
       style="display:block;background:transparent;color:${CLR.teal};font-family:${SYS};font-size:14px;font-weight:600;text-decoration:none;text-align:center;padding:13px 12px;border-radius:6px;border:1px solid ${CLR.teal};min-height:44px;box-sizing:border-box;">
      Reply with a question
    </a>
  </td></tr>`;
}

function renderFooter(unsubscribeToken: string | null): string {
  const unsubUrl = unsubscribeToken
    ? `https://www.thetideline.co/unsubscribe?token=${unsubscribeToken}`
    : 'https://www.thetideline.co/unsubscribe';
  return `<tr><td style="padding:12px 18px 16px;border-top:0.5px solid ${CLR.border};">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${SYS};font-size:10.5px;color:${CLR.textMuted};">Tideline &middot; thetideline.co</td>
      <td style="text-align:right;">
        <a href="${unsubUrl}" style="font-family:${SYS};font-size:10.5px;color:${CLR.textMuted};text-decoration:underline;">Unsubscribe</a>
      </td>
    </tr></table>
  </td></tr>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function compileBriefHtml(data: BriefData, user: BriefUser): string {
  const body = [
    renderMasthead(data.dateStr),
    renderLead(data.lead),
    renderConditions(data.conditions),
    renderEvidence(data.evidence),
    renderWhatToWatch(data.whatToWatch),
    renderAcrossSector(data.acrossSector),
    renderQuickAsk(data.quickAsk),
    renderWorkRevealed(data.workRevealedLine),
    renderSignOff(data.signOff),
    renderCTAs(),
    renderFooter(user.unsubscribeToken),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
  <title>Tideline Brief</title>
  <style>
    /* Suppress browser/client auto-link colouring. Explicit inline colors on CTAs override this. */
    body a { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width:480px) {
      .outer-td { padding-left:0 !important; padding-right:0 !important; }
      .card     { border-radius:0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CLR.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${renderPreheader(data.preheader)}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CLR.bg};">
    <tr><td align="center" class="outer-td" style="padding:16px 8px 32px;">
      <table class="card" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:${CLR.surface};border-radius:8px;overflow:hidden;">
        ${body}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
