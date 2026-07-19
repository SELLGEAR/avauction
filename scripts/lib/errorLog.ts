import { mkdir, appendFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface ErrorLogEntry {
  url: string;
  message: string;
  failedAt: string;
}

function errorLogPath(scraperName: string): string {
  // Relative to the directory `npm run scrape:*` is invoked from (project root).
  return join(process.cwd(), 'state', scraperName, 'errors.ndjson');
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

/**
 * Appended immediately on every failure during the main pass — one write per
 * error, not buffered across the run — so a hard kill loses at most the
 * in-flight item, not the accumulated failure list.
 */
export async function appendErrorEntry(scraperName: string, entry: ErrorLogEntry): Promise<void> {
  const path = errorLogPath(scraperName);
  await ensureDir(path);
  await appendFile(path, JSON.stringify(entry) + '\n', 'utf8');
}

/**
 * Reads back accumulated failures, deduplicated by URL (last occurrence wins,
 * since the same URL can fail more than once across restarts). Malformed
 * lines — e.g. a partial write from a hard kill mid-append — are skipped
 * rather than failing the whole read.
 */
export async function readErrorEntries(scraperName: string): Promise<ErrorLogEntry[]> {
  const path = errorLogPath(scraperName);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const byUrl = new Map<string, ErrorLogEntry>();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry: ErrorLogEntry = JSON.parse(line);
      byUrl.set(entry.url, entry);
    } catch {
      continue;
    }
  }
  return [...byUrl.values()];
}

/**
 * Overwrites the log with exactly the given entries — called after the retry
 * pass so the file always reflects "currently still failing," not an
 * ever-growing history across every run.
 */
export async function writeErrorEntries(scraperName: string, entries: ErrorLogEntry[]): Promise<void> {
  const path = errorLogPath(scraperName);
  await ensureDir(path);
  const body = entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length > 0 ? '\n' : '');
  await writeFile(path, body, 'utf8');
}
