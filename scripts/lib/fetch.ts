const DEFAULT_USER_AGENT = 'AVauctionBot/1.0 (+https://avauction.com; seeding master equipment database)';
const DEFAULT_CRAWL_DELAY_MS = 500;
const DEFAULT_MAX_RETRIES = 3;

// Keyed by origin rather than a single cached value — each scraper only ever
// hits one origin per process today, but a single unkeyed cache would silently
// apply the wrong site's robots rules if that ever changed.
const robotsRulesByOrigin = new Map<string, string[]>();

async function loadRobotsRules(origin: string, userAgent: string): Promise<string[]> {
  const cached = robotsRulesByOrigin.get(origin);
  if (cached) return cached;

  const res = await fetch(`${origin}/robots.txt`, {
    headers: { 'User-Agent': userAgent },
  });
  const body = res.ok ? await res.text() : '';

  const rules = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith('disallow:'))
    .map((line) => line.slice('disallow:'.length).trim())
    .filter(Boolean);

  robotsRulesByOrigin.set(origin, rules);
  return rules;
}

export async function assertAllowedByRobots(url: string, userAgent: string = DEFAULT_USER_AGENT): Promise<void> {
  const parsed = new URL(url);
  const rules = await loadRobotsRules(parsed.origin, userAgent);
  const blocked = rules.some((rule) => parsed.pathname.startsWith(rule));
  if (blocked) {
    throw new Error(`Blocked by robots.txt: ${parsed.pathname}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchOptions {
  userAgent?: string;
  crawlDelayMs?: number;
  maxRetries?: number;
}

/**
 * Sequential, rate-limited fetch with retry, gated by robots.txt on every
 * call. Per-scraper overrides exist for sites that need a longer crawl delay
 * or turn out to require a different UA string — defaults match what AV-iQ
 * was already using.
 */
export async function fetchWithRateLimit(url: string, opts: FetchOptions = {}): Promise<string> {
  const userAgent = opts.userAgent ?? DEFAULT_USER_AGENT;
  const crawlDelayMs = opts.crawlDelayMs ?? DEFAULT_CRAWL_DELAY_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

  await assertAllowedByRobots(url, userAgent);

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const body = await res.text();
      await sleep(crawlDelayMs);
      return body;
    } catch (err) {
      lastError = err;
      await sleep(crawlDelayMs * attempt);
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts: ${url} (${String(lastError)})`);
}
