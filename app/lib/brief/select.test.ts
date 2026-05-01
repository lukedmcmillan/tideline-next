// app/lib/brief/select.test.ts
import { describe, it, expect } from 'vitest';
import { cleanTitle, bandForScore, generateSignOff, isoWeekNumber } from './utils';
import { selectQuickAsk, WEEKDAY_ASKS, EDGE_CASE_ASKS } from './quick-asks';
import {
  selectLead,
  selectConditions,
  selectEvidence,
  selectWhatToWatch,
  selectAcrossSector,
  type StoryRow,
  type TrackerScoreRow,
  type GovernanceEventRow,
} from './select';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeStory = (overrides: Partial<StoryRow> = {}): StoryRow => ({
  id:                'story-1',
  title:             'Test headline',
  source_name:       'Test Source',
  topic:             'governance',
  significance_score:5,
  short_summary:     'A short summary of the story.',
  published_at:      new Date().toISOString(),
  status:            'live',
  ...overrides,
});

const makeTracker = (overrides: Partial<TrackerScoreRow> = {}): TrackerScoreRow => ({
  tracker_slug:    'bbnj',
  score:           6.0,
  calculated_at:   new Date().toISOString(),
  sparklineValues: [4, 5, 5.5, 6, 6.2, 6, 5.8, 6.1, 6, 6.2, 6.1, 6],
  ...overrides,
});

const makeEvent = (overrides: Partial<GovernanceEventRow> = {}): GovernanceEventRow => ({
  id:        'event-1',
  title:     'BBNJ Intersessional Meeting',
  starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  topics:    ['governance'],
  ...overrides,
});

// ── cleanTitle ────────────────────────────────────────────────────────────────

describe('cleanTitle', () => {
  it('strips pipe-suffix source attributions', () => {
    const input = 'Conservation of BBNJ beyond National Jurisdiction | OSPAR Commission';
    const result = cleanTitle(input);
    expect(result).toBe('Conservation of BBNJ beyond National Jurisdiction');
    expect(result).not.toContain('OSPAR');
  });

  it('strips multi-colon source prefixes when result is meaningful', () => {
    const input = 'Policy paper: Fisheries: Bilateral agreement with Norway for 2026';
    const result = cleanTitle(input);
    expect(result).toBe('Bilateral agreement with Norway for 2026');
  });

  it('preserves two-part colon titles (not a prefix pattern)', () => {
    const input = 'MEPC 84: Carbon intensity targets adopted';
    const result = cleanTitle(input);
    expect(result).toBe('MEPC 84: Carbon intensity targets adopted');
  });

  it('takes only the first pipe segment even when multiple pipes exist', () => {
    const input = 'Bloomberg Green | Norway agreement signed | Ocean briefing';
    const result = cleanTitle(input);
    expect(result).toBe('Bloomberg Green');
  });

  it('leaves clean headlines unchanged', () => {
    const input = 'Atlantic recovery accelerating - report from Scotland';
    const result = cleanTitle(input);
    expect(result).toBe('Atlantic recovery accelerating - report from Scotland');
  });

  it('decodes HTML entities', () => {
    const input = 'Fisheries &amp; Oceans Canada: new framework';
    const result = cleanTitle(input);
    expect(result).toContain('&');
    expect(result).not.toContain('&amp;');
  });

  it('replaces em dashes with period-space', () => {
    const input = 'New treaty \u2014 a milestone for ocean governance';
    const result = cleanTitle(input);
    expect(result).not.toContain('\u2014');
    expect(result).toContain('. ');
  });

  it('capitalises first letter', () => {
    const result = cleanTitle('something important happened');
    expect(result[0]).toBe('S');
  });
});

// ── bandForScore ──────────────────────────────────────────────────────────────

describe('bandForScore', () => {
  it('returns ELEVATED for scores >= 5.0', () => {
    expect(bandForScore(5.0)).toBe('ELEVATED');
    expect(bandForScore(7.5)).toBe('ELEVATED');
    expect(bandForScore(10)).toBe('ELEVATED');
  });

  it('returns WATCH for scores 3.0-4.99', () => {
    expect(bandForScore(3.0)).toBe('WATCH');
    expect(bandForScore(4.99)).toBe('WATCH');
  });

  it('returns LOW for scores below 3.0', () => {
    expect(bandForScore(2.9)).toBe('LOW');
    expect(bandForScore(0)).toBe('LOW');
  });
});

// ── generateSignOff ───────────────────────────────────────────────────────────

describe('generateSignOff', () => {
  it('returns Monday copy on monday', () => {
    const result = generateSignOff('monday');
    expect(result).toContain('start to the week');
    expect(result).toContain('tomorrow at 7am');
  });

  it('returns Friday copy on friday (mentions weekend)', () => {
    const result = generateSignOff('friday');
    expect(result).toContain('weekend');
    expect(result).toContain('Monday morning');
  });

  it('contains no em dashes in any weekday', () => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
    for (const day of weekdays) {
      expect(generateSignOff(day)).not.toContain('\u2014');
    }
  });
});

// ── selectQuickAsk ────────────────────────────────────────────────────────────

describe('selectQuickAsk', () => {
  const noContext = { isFirstBrief: false, recentHighSigCount: 0, recentLowActivityWeek: false };

  it('returns first_brief copy when isFirstBrief is true', () => {
    const result = selectQuickAsk('monday', 10, { ...noContext, isFirstBrief: true });
    expect(result).toBe(EDGE_CASE_ASKS.first_brief);
  });

  it('returns high_significance_week when recentHighSigCount >= 3', () => {
    const result = selectQuickAsk('tuesday', 10, { ...noContext, recentHighSigCount: 3 });
    expect(result).toBe(EDGE_CASE_ASKS.high_significance_week);
  });

  it('returns quiet_week when recentLowActivityWeek is true', () => {
    const result = selectQuickAsk('wednesday', 10, { ...noContext, recentLowActivityWeek: true });
    expect(result).toBe(EDGE_CASE_ASKS.quiet_week);
  });

  it('returns variant A on even week numbers', () => {
    const result = selectQuickAsk('monday', 20, noContext); // even week
    expect(result).toBe(WEEKDAY_ASKS.monday.a);
  });

  it('returns variant B on odd week numbers', () => {
    const result = selectQuickAsk('monday', 21, noContext); // odd week
    expect(result).toBe(WEEKDAY_ASKS.monday.b);
  });

  it('first_brief takes priority over high_significance', () => {
    const result = selectQuickAsk('monday', 10, {
      isFirstBrief: true,
      recentHighSigCount: 5,
      recentLowActivityWeek: true,
    });
    expect(result).toBe(EDGE_CASE_ASKS.first_brief);
  });
});

// ── selectLead ────────────────────────────────────────────────────────────────

describe('selectLead', () => {
  // Mode a: story-led (significance >= 50)
  it('[mode a] returns story type when max significance >= 50', () => {
    const stories = [makeStory({ id: 'high', topic: 'governance', significance_score: 72 })];
    const trackers = [makeTracker({ tracker_slug: 'bbnj' })];
    const lead = selectLead(stories, trackers, ['bbnj']);
    expect(lead.type).toBe('story');
    if (lead.type === 'story') expect(lead.storyId).toBe('high');
  });

  it('[mode a] selects highest significance when multiple qualify', () => {
    const stories = [
      makeStory({ id: 'lower', topic: 'governance', significance_score: 50 }),
      makeStory({ id: 'higher', topic: 'governance', significance_score: 75 }),
    ];
    const lead = selectLead(stories, [], ['bbnj']);
    expect(lead.type).toBe('story');
    if (lead.type === 'story') expect(lead.storyId).toBe('higher');
  });

  // Mode b: hybrid (pool not empty, significance < 50)
  it('[mode b] returns state type with tracker framing when max significance < 50', () => {
    const stories = [makeStory({ topic: 'governance', significance_score: 13 })];
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 5.9 })];
    const lead = selectLead(stories, trackers, ['bbnj']);
    expect(lead.type).toBe('state');
    if (lead.type === 'state') {
      expect(lead.headline).toContain('Pulse 5.9');
      expect(lead.headline).toContain('BBNJ Treaty');
      // interpretation uses the story content, not a "quiet" fallback
      expect(lead.interpretation).toBe('A short summary of the story.');
    }
  });

  it('[mode b] hybrid headline contains cleaned story title', () => {
    const stories = [makeStory({ title: 'BBNJ Treaty progress | UN News', topic: 'governance', significance_score: 20 })];
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 5.0 })];
    const lead = selectLead(stories, trackers, ['bbnj']);
    if (lead.type === 'state') {
      expect(lead.headline).not.toContain('| UN News');
      expect(lead.headline).toContain('BBNJ Treaty progress');
    }
  });

  // Mode c: state-led (empty pool)
  it('[mode c] falls back to pure state-of-tracker when no matching stories', () => {
    const trackers = [makeTracker({ tracker_slug: 'imo-shipping', score: 7.5 })];
    const lead = selectLead([], trackers, ['imo-shipping']);
    expect(lead.type).toBe('state');
    if (lead.type === 'state') {
      expect(lead.headline).toContain('Pulse 7.5');
      expect(lead.headline).toContain('IMO Shipping');
      expect(lead.interpretation).toContain('Quiet morning');
    }
  });

  it('[mode c] returns absolute fallback when no stories and no trackers', () => {
    const lead = selectLead([], [], ['bbnj']);
    expect(lead.type).toBe('state');
  });

  // Cross-cutting
  it('ignores stories without short_summary', () => {
    const stories = [makeStory({ short_summary: null, description: null, topic: 'governance', significance_score: 80 })];
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 5.0 })];
    const lead = selectLead(stories, trackers, ['bbnj']);
    // No summary → drops to state-led
    expect(lead.type).toBe('state');
    if (lead.type === 'state') expect(lead.interpretation).toContain('Quiet');
  });

  it('ignores stories not matching user content topics', () => {
    const stories = [makeStory({ topic: 'climate', significance_score: 80 })]; // climate not in bbnj topics
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 5.0 })];
    const lead = selectLead(stories, trackers, ['bbnj']);
    expect(lead.type).toBe('state');
  });
});

// ── selectConditions ──────────────────────────────────────────────────────────

describe('selectConditions', () => {
  it('returns only ELEVATED trackers (score >= 5.0)', () => {
    const trackers = [
      makeTracker({ tracker_slug: 'bbnj', score: 6.0 }),
      makeTracker({ tracker_slug: 'imo-shipping', score: 4.9 }),
    ];
    const conditions = selectConditions(trackers, ['bbnj', 'imo-shipping']);
    expect(conditions).toHaveLength(1);
    expect(conditions[0].trackerLabel).toBe('BBNJ Treaty');
  });

  it('shows top 1 tracker when all are below ELEVATED threshold', () => {
    const trackers = [
      makeTracker({ tracker_slug: 'bbnj', score: 2.0 }),
      makeTracker({ tracker_slug: 'imo-shipping', score: 3.5 }),
    ];
    const conditions = selectConditions(trackers, ['bbnj', 'imo-shipping']);
    expect(conditions).toHaveLength(1);
    expect(conditions[0].trackerLabel).toBe('IMO Shipping'); // highest score
  });

  it('caps at 2 trackers even when 3+ are elevated', () => {
    const trackers = [
      makeTracker({ tracker_slug: 'bbnj', score: 8.0 }),
      makeTracker({ tracker_slug: 'imo-shipping', score: 7.0 }),
      makeTracker({ tracker_slug: 'iuu', score: 5.5 }),
    ];
    const conditions = selectConditions(trackers, ['bbnj', 'imo-shipping', 'iuu']);
    expect(conditions).toHaveLength(2);
  });

  it('returns empty array when user has no matching trackers', () => {
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 7 })];
    const conditions = selectConditions(trackers, ['imo-shipping']);
    expect(conditions).toHaveLength(0);
  });

  it('assigns correct band labels', () => {
    const trackers = [makeTracker({ tracker_slug: 'bbnj', score: 6.5 })];
    const conditions = selectConditions(trackers, ['bbnj']);
    expect(conditions[0].band).toBe('ELEVATED');
    expect(conditions[0].score).toBe(6.5);
  });
});

// ── selectEvidence ────────────────────────────────────────────────────────────

describe('selectEvidence', () => {
  it('excludes the lead story', () => {
    const stories = [
      makeStory({ id: 'lead-id', topic: 'governance', significance_score: 9 }),
      makeStory({ id: 'ev-1', topic: 'governance', significance_score: 7 }),
    ];
    const lead = { type: 'story' as const, headline: 'x', storyId: 'lead-id', interpretation: 'x' };
    const evidence = selectEvidence(stories, lead, ['bbnj']);
    expect(evidence.map(e => e.storyId)).not.toContain('lead-id');
  });

  it('assigns colors teal, amber, grey in order', () => {
    const stories = [
      makeStory({ id: 'a', topic: 'governance', significance_score: 9 }),
      makeStory({ id: 'b', topic: 'governance', significance_score: 8 }),
      makeStory({ id: 'c', topic: 'governance', significance_score: 7 }),
    ];
    const lead = { type: 'state' as const, headline: 'x', interpretation: 'x' };
    const evidence = selectEvidence(stories, lead, ['bbnj']);
    expect(evidence[0].color).toBe('teal');
    expect(evidence[1].color).toBe('amber');
    expect(evidence[2].color).toBe('grey');
  });

  it('returns empty array when no qualifying stories', () => {
    const evidence = selectEvidence([], { type: 'state', headline: 'x', interpretation: 'x' }, ['bbnj']);
    expect(evidence).toHaveLength(0);
  });

  it('caps at 3 items', () => {
    const stories = Array.from({ length: 6 }, (_, i) =>
      makeStory({ id: `s${i}`, topic: 'governance', significance_score: 9 - i })
    );
    const lead = { type: 'state' as const, headline: 'x', interpretation: 'x' };
    const evidence = selectEvidence(stories, lead, ['bbnj']);
    expect(evidence.length).toBeLessThanOrEqual(3);
  });

  it('deduplicates near-identical stories (crawfish consultation)', () => {
    const base = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const stories = [
      makeStory({
        id: 'crawfish-1',
        title: 'A consultation on a seasonal closure of crawfish fishery',
        topic: 'fisheries',
        significance_score: 30,
        published_at: base,
      }),
      makeStory({
        id: 'crawfish-2',
        title: 'Crawfish consultation 2026 seasonal closure',
        topic: 'fisheries',
        significance_score: 25,
        published_at: twoDaysAgo,
      }),
    ];
    const lead = { type: 'state' as const, headline: 'x', interpretation: 'x' };
    const evidence = selectEvidence(stories, lead, ['wto-fisheries']);
    // Only one crawfish story should appear
    expect(evidence.length).toBe(1);
    // Higher significance is kept
    expect(evidence[0].storyId).toBe('crawfish-1');
  });

  it('prefers action-signal story over non-action story within 10 significance points', () => {
    const stories = [
      makeStory({
        id: 'explainer',
        title: 'AMOC slowdown explained: what the science shows',
        topic: 'governance',
        significance_score: 40,
      }),
      makeStory({
        id: 'decision',
        title: 'ICES consultation opens on Northeast Atlantic closure deadline',
        topic: 'governance',
        significance_score: 35,
      }),
    ];
    const lead = { type: 'state' as const, headline: 'x', interpretation: 'x' };
    const evidence = selectEvidence(stories, lead, ['bbnj']);
    // ICES consultation (action_signal=1) should beat AMOC explainer (action_signal=0)
    // despite lower significance, because they're within 10 points
    expect(evidence[0].storyId).toBe('decision');
  });
});

// ── selectWhatToWatch ─────────────────────────────────────────────────────────

describe('selectWhatToWatch', () => {
  it('returns events relevant to user topics', () => {
    const events = [
      makeEvent({ topics: ['governance'] }),
      makeEvent({ id: 'ev-2', title: 'Deep-sea mining session', topics: ['dsm'] }),
    ];
    const watch = selectWhatToWatch(events, ['bbnj']); // bbnj → governance
    expect(watch.some(e => e.description.includes('BBNJ'))).toBe(true);
  });

  it('includes events with no topic (unclassified)', () => {
    const events = [makeEvent({ topics: [] })];
    const watch = selectWhatToWatch(events, ['bbnj']);
    expect(watch).toHaveLength(1);
  });

  it('caps at 3 events', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: `ev-${i}`,
        starts_at: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        topics: ['governance'],
      })
    );
    const watch = selectWhatToWatch(events, ['bbnj']);
    expect(watch.length).toBeLessThanOrEqual(3);
  });

  it('marks events within 7 days as isNear', () => {
    const events = [makeEvent({ starts_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() })];
    const watch = selectWhatToWatch(events, ['bbnj']);
    expect(watch[0].isNear).toBe(true);
  });

  it('returns empty array when no events match', () => {
    const events = [makeEvent({ topics: ['dsm'] })];
    const watch = selectWhatToWatch(events, ['imo-shipping']); // shipping doesn't map to dsm
    expect(watch).toHaveLength(0);
  });
});

// ── selectAcrossSector ────────────────────────────────────────────────────────

describe('selectAcrossSector', () => {
  it('returns a story NOT in user content topics', () => {
    const stories = [
      makeStory({ id: 'in-topic', topic: 'governance', significance_score: 9 }),
      makeStory({ id: 'cross', topic: 'climate', significance_score: 8 }),
    ];
    const result = selectAcrossSector(stories, ['bbnj']); // bbnj → governance
    expect(result).not.toBeNull();
    expect(result?.storyId).toBe('cross');
  });

  it('returns null when all stories are in user topics', () => {
    const stories = [makeStory({ topic: 'governance' })];
    const result = selectAcrossSector(stories, ['bbnj']); // bbnj → governance
    expect(result).toBeNull();
  });

  it('returns null when no stories have short_summary', () => {
    const stories = [makeStory({ topic: 'climate', short_summary: null })];
    const result = selectAcrossSector(stories, ['bbnj']);
    expect(result).toBeNull();
  });

  it('selects highest significance cross-sector story', () => {
    const stories = [
      makeStory({ id: 'low', topic: 'climate', significance_score: 3 }),
      makeStory({ id: 'high', topic: 'climate', significance_score: 8 }),
    ];
    const result = selectAcrossSector(stories, ['bbnj']);
    expect(result?.storyId).toBe('high');
  });
});
