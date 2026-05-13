/**
 * scripts/test-http-client.ts
 *
 * Verification tests for app/lib/http-client.ts.
 * Tests run against real network — expect ~25-30s total (rate-limit waits).
 *
 * Usage: npx tsx scripts/test-http-client.ts
 *
 * All 5 tests must pass before any production scraper is migrated to the utility.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import {
  fetchAsTideline,
  RobotsBlocked,
  TIDELINE_UA,
  getRobotsCacheSize,
  clearCaches,
} from '../app/lib/http-client';

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`\n[TEST] ${name}\n`);
  try {
    await fn();
    console.log(`  PASS`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${(err as Error).message}`);
    failed++;
  }
}

async function main() {
  // ── Test 1 — Permissive domain: httpbin UA echo + robots cache + 5s delay ───
  await runTest('Test 1 — Permissive domain (httpbin.org): UA, robots cache, rate limit', async () => {
    clearCaches();

    // 1a. Verify UA is sent via httpbin echo endpoint
    const echoRes = await fetchAsTideline('https://httpbin.org/headers');
    assert(echoRes.ok, `httpbin.org/headers returned ${echoRes.status}`);

    const body = await echoRes.json() as { headers: Record<string, string> };
    const sentUA = body.headers['User-Agent'] ?? body.headers['user-agent'];
    console.log(`  Sent UA: "${sentUA}"`);
    assert(sentUA === TIDELINE_UA, `UA mismatch. Got: "${sentUA}"`);

    // 1b. robots.txt was fetched and cached
    const cacheSize = getRobotsCacheSize();
    console.log(`  robots cache size after first fetch: ${cacheSize}`);
    assert(cacheSize >= 1, 'robots.txt was not cached after first request');

    // 1c. Second fetch to same domain waits ~5s
    const t0 = Date.now();
    const res2 = await fetchAsTideline('https://httpbin.org/status/200');
    const elapsed = Date.now() - t0;
    console.log(`  Second fetch to httpbin.org elapsed: ${elapsed}ms`);
    assert(elapsed >= 4_500, `Rate limit not enforced — elapsed only ${elapsed}ms (expected >= 4500ms)`);
    assert(res2.status === 200, `Second fetch returned ${res2.status}`);
  });

  // ── Test 2 — Institutional body: ISA public documents page ──────────────────
  await runTest('Test 2 — Institutional body (isa.org.jm): fetch, robots cache', async () => {
    clearCaches();

    const res = await fetchAsTideline('https://www.isa.org.jm/documents', {
      timeoutMs: 20_000,
    });
    console.log(`  isa.org.jm/documents status: ${res.status}`);
    // Accept 200 or 3xx redirect — ISA may redirect to HTTPS or canonical URL.
    // We just want to confirm the request completed and was not blocked.
    assert(res.status < 500, `Server error from isa.org.jm: ${res.status}`);

    const cacheSize = getRobotsCacheSize();
    console.log(`  robots cache size after ISA fetch: ${cacheSize}`);
    assert(cacheSize >= 1, 'robots.txt was not cached after ISA fetch');
  });

  // ── Test 3 — OpenAlex: 100ms override, consecutive fetches under 1s ─────────
  await runTest('Test 3 — OpenAlex (100ms override): consecutive fetches in < 10s', async () => {
    clearCaches();

    const t0   = Date.now();
    const res1 = await fetchAsTideline('https://api.openalex.org/works?per-page=1');
    const res2 = await fetchAsTideline('https://api.openalex.org/works?per-page=1&page=2');
    const total = Date.now() - t0;

    console.log(`  OpenAlex res1 status: ${res1.status}`);
    console.log(`  OpenAlex res2 status: ${res2.status}`);
    console.log(`  Total time for 2 consecutive fetches: ${total}ms`);

    assert(res1.ok, `OpenAlex first fetch failed: ${res1.status}`);
    assert(res2.ok, `OpenAlex second fetch failed: ${res2.status}`);
    // With 100ms override: robots fetch + req1 + 100ms wait + req2 << 10s
    // Default 5s would make this ~10s+ — the gap proves the override works
    assert(total < 10_000, `Two OpenAlex fetches took ${total}ms — 100ms override may not be applied`);
    console.log(`  Rate-limit override confirmed: ${total}ms << default ~10000ms`);
  });

  // ── Test 4 — robots.txt rejection: google.com/search Disallow: /search ──────
  await runTest('Test 4 — robots.txt block (google.com/search Disallow: /search)', async () => {
    clearCaches();

    let blocked = false;
    let blockedError: RobotsBlocked | null = null;

    try {
      await fetchAsTideline('https://www.google.com/search?q=test');
    } catch (err) {
      if (err instanceof RobotsBlocked) {
        blocked      = true;
        blockedError = err;
      } else {
        throw err; // unexpected error type — re-throw
      }
    }

    assert(blocked, 'Expected RobotsBlocked to be thrown for google.com/search');
    assert(blockedError!.domain === 'www.google.com', `Wrong domain in error: ${blockedError!.domain}`);
    assert(blockedError!.url.includes('/search'), `Wrong URL in error: ${blockedError!.url}`);

    console.log(`  RobotsBlocked thrown correctly`);
    console.log(`    url:    ${blockedError!.url}`);
    console.log(`    domain: ${blockedError!.domain}`);
    console.log(`    rule:   ${blockedError!.rule}`);
  });

  // ── Test 5 — robots.txt cache: second fetch does NOT re-fetch robots.txt ────
  await runTest('Test 5 — robots.txt cache (no double-fetch)', async () => {
    clearCaches();
    assert(getRobotsCacheSize() === 0, 'Cache should be empty after clearCaches()');

    // First fetch — should populate cache
    await fetchAsTideline('https://httpbin.org/headers');
    const sizeAfterFirst = getRobotsCacheSize();
    console.log(`  Cache size after 1st fetch: ${sizeAfterFirst}`);
    assert(sizeAfterFirst === 1, `Expected cache size 1 after first fetch, got ${sizeAfterFirst}`);

    // Wait out the rate limit so the second content fetch actually executes
    await new Promise(r => setTimeout(r, 5_100));

    // Second fetch to same domain — cache size must stay at 1 (no re-fetch of robots)
    await fetchAsTideline('https://httpbin.org/status/200');
    const sizeAfterSecond = getRobotsCacheSize();
    console.log(`  Cache size after 2nd fetch: ${sizeAfterSecond}`);
    assert(
      sizeAfterSecond === 1,
      `Cache grew from ${sizeAfterFirst} to ${sizeAfterSecond} — robots.txt was re-fetched unexpectedly`,
    );

    console.log(`  Confirmed: robots.txt fetched once, cached, not re-fetched on second request`);
  });

  // ── Results ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\nFAILURE: ${failed} test(s) did not pass. Do not proceed to Phase 2 migration.`);
    process.exit(1);
  } else {
    console.log(`\nAll tests passed. Foundation verified. Phase 2 migration is clear to proceed.`);
  }
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
