/**
 * app/lib/http-client.ts
 *
 * Shared HTTP fetch utility for all Tideline scrapers.
 * Wraps platform fetch() with:
 *   - Canonical Tideline user-agent + contact headers
 *   - robots.txt compliance (robots-parser, 24h in-memory cache)
 *   - Per-domain rate limiting (5s default, overrides for known-permissive APIs)
 *
 * Usage:
 *   import { fetchAsTideline, RobotsBlocked, RateLimitTimeout } from '@/app/lib/http-client';
 *   const res = await fetchAsTideline('https://example.com/page');
 *
 * Phase 1: foundation only. Production scrapers migrated in Phase 2.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const robotsParser = require('robots-parser') as (url: string, txt: string) => RobotsTxt;

// ── robots-parser Robot shape ─────────────────────────────────────────────────
interface RobotsTxt {
  isAllowed(url: string, ua?: string): boolean | undefined;
  getCrawlDelay(ua?: string): number | undefined;
}

// ── Canonical crawler identity ────────────────────────────────────────────────
export const TIDELINE_UA =
  'Tideline/1.0 (+https://thetideline.co/about-our-crawler; research@thetideline.co)';

const TIDELINE_HEADERS: Record<string, string> = {
  'User-Agent':        TIDELINE_UA,
  'From':              'research@thetideline.co',
  'X-Crawler-Contact': 'research@thetideline.co',
};

// ── Typed errors ──────────────────────────────────────────────────────────────
export class RobotsBlocked extends Error {
  constructor(
    public readonly url:     string,
    public readonly domain:  string,
    public readonly rule:    string,
  ) {
    super(`Robots.txt blocks ${url} (domain: ${domain}, rule: ${rule})`);
    this.name = 'RobotsBlocked';
  }
}

export class RateLimitTimeout extends Error {
  constructor(
    public readonly url:    string,
    public readonly domain: string,
    public readonly waitMs: number,
  ) {
    super(`Rate-limit wait for ${domain} would exceed 30s (needed ${waitMs}ms)`);
    this.name = 'RateLimitTimeout';
  }
}

// ── Per-domain rate-limit overrides ───────────────────────────────────────────
// Default: 5000ms (1 req / 5s). Overrides for sources with published policies
// or where Tideline is not the actual HTTP client.
//
// api.openalex.org — 100ms: OpenAlex Polite Pool policy allows ~10 req/s for
//   crawlers that include a mailto: contact in User-Agent.
//   Source: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication
//
// r.jina.ai — 0ms: Jina is a proxy; Tideline is not the direct HTTP client
//   toward the target domain. Jina manages its own crawl etiquette and rate
//   limiting per target. Tideline does not control downstream behaviour.
//
// *.googleapis.com — 100ms: Google APIs publish per-project quotas; 100ms
//   covers the standard free-tier burst (100 req/s) with headroom.
//   Source: https://cloud.google.com/apis/design/design_patterns#rate_limiting
export const RATE_LIMIT_OVERRIDES: Map<string, number> = new Map([
  ['api.openalex.org', 100],
  ['r.jina.ai',        0],
]);

const DEFAULT_RATE_LIMIT_MS = 5_000;
const MAX_WAIT_MS           = 30_000;
const DEFAULT_TIMEOUT_MS    = 30_000;
const ROBOTS_CACHE_TTL_MS   = 24 * 60 * 60 * 1000; // 24 hours

// ── In-process caches (module-level singletons) ────────────────────────────
interface CachedRobots {
  robots:    RobotsTxt;
  fetchedAt: number;
}

const robotsCache:     Map<string, CachedRobots> = new Map();
const lastRequestTime: Map<string, number>        = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getRateLimitMs(domain: string): number {
  if (RATE_LIMIT_OVERRIDES.has(domain)) {
    return RATE_LIMIT_OVERRIDES.get(domain)!;
  }
  // Wildcard match for *.googleapis.com
  if (domain.endsWith('.googleapis.com')) return 100;
  return DEFAULT_RATE_LIMIT_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── robots.txt fetch + cache ──────────────────────────────────────────────────
async function getRobots(domain: string, protocol: string): Promise<RobotsTxt | null> {
  const now    = Date.now();
  const cached = robotsCache.get(domain);

  if (cached && now - cached.fetchedAt < ROBOTS_CACHE_TTL_MS) {
    return cached.robots;
  }

  const robotsUrl = `${protocol}//${domain}/robots.txt`;
  try {
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': TIDELINE_UA },
      signal:  AbortSignal.timeout(10_000),
    });

    const txt    = res.ok ? await res.text() : '';
    const robots = robotsParser(robotsUrl, txt);
    robotsCache.set(domain, { robots, fetchedAt: now });
    return robots;
  } catch {
    // If robots.txt is unreachable, fall through and allow the request.
    // Blocking on inability to read robots.txt would be over-restrictive.
    return null;
  }
}

// ── Public options type ────────────────────────────────────────────────────────
export interface FetchOptions extends RequestInit {
  /**
   * Skip rate limiting for this request.
   * ONLY use in emergency override scenarios.
   * Add a code comment at the call site explaining why.
   */
  skipRateLimit?: boolean;

  /**
   * Skip robots.txt check for this request.
   * ONLY use in emergency override scenarios.
   * Add a code comment at the call site explaining why.
   */
  skipRobots?: boolean;

  /**
   * Request timeout in milliseconds. Default: 30000.
   */
  timeoutMs?: number;
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Fetch a URL using the canonical Tideline crawler identity.
 *
 * Enforces robots.txt compliance and per-domain rate limiting.
 * Returns a standard Response object; all status codes pass through.
 *
 * Throws:
 *   - RobotsBlocked  — if robots.txt disallows the URL
 *   - RateLimitTimeout — if the required wait exceeds 30 seconds
 */
export async function fetchAsTideline(
  url:     string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipRateLimit, skipRobots, timeoutMs, ...fetchInit } = options;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`fetchAsTideline: invalid URL "${url}"`);
  }

  const domain   = parsed.hostname;
  const protocol = parsed.protocol;

  // ── 1. robots.txt check ────────────────────────────────────────────────────
  let crawlDelayMs = 0;

  if (!skipRobots) {
    const robots = await getRobots(domain, protocol);

    if (robots) {
      const allowed = robots.isAllowed(url, 'Tideline') ??
                      robots.isAllowed(url);        // fallback to *

      if (allowed === false) {
        // Determine matching rule label for the error (best-effort)
        const rule = `Disallow on ${domain}/robots.txt`;
        throw new RobotsBlocked(url, domain, rule);
      }

      // Respect Crawl-delay from robots.txt as a per-domain floor.
      // Takes the Tideline-specific delay, falling back to *.
      const robotsDelay = (robots.getCrawlDelay('Tideline') ??
                           robots.getCrawlDelay()) ?? 0;
      crawlDelayMs = robotsDelay * 1000;
    }
  }

  // ── 2. Per-domain rate limiting ────────────────────────────────────────────
  if (!skipRateLimit) {
    const configuredMs  = getRateLimitMs(domain);
    const effectiveMs   = Math.max(configuredMs, crawlDelayMs);
    const last          = lastRequestTime.get(domain) ?? 0;
    const elapsed       = Date.now() - last;
    const waitMs        = Math.max(0, effectiveMs - elapsed);

    if (waitMs > MAX_WAIT_MS) {
      throw new RateLimitTimeout(url, domain, waitMs);
    }

    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  // ── 3. Record request time ─────────────────────────────────────────────────
  lastRequestTime.set(domain, Date.now());

  // ── 4. Execute fetch ───────────────────────────────────────────────────────
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const mergedHeaders = {
    ...TIDELINE_HEADERS,
    ...(fetchInit.headers as Record<string, string> | undefined ?? {}),
  };

  return fetch(url, {
    ...fetchInit,
    headers: mergedHeaders,
    signal:  AbortSignal.timeout(timeout),
  });
}

// ── Cache inspection (for tests) ─────────────────────────────────────────────
export function getRobotsCacheSize(): number {
  return robotsCache.size;
}

export function clearCaches(): void {
  robotsCache.clear();
  lastRequestTime.clear();
}
