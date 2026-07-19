import type { ScrapeRunSummary } from './types.js';

export function createSummary(): ScrapeRunSummary {
  return { discovered: 0, fetched: 0, parsed: 0, upserted: 0, skipped: 0, errors: 0 };
}

export function log(label: string, message: string): void {
  console.log(`[${label}] ${message}`);
}

export function logError(label: string, context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${label}] ${context}: ${message}`);
}

export function printSummary(label: string, summary: ScrapeRunSummary): void {
  console.log(`\n[${label}] Run complete`);
  console.log(`  discovered: ${summary.discovered}`);
  console.log(`  fetched:    ${summary.fetched}`);
  console.log(`  parsed:     ${summary.parsed}`);
  console.log(`  upserted:   ${summary.upserted}`);
  console.log(`  skipped:    ${summary.skipped}`);
  console.log(`  errors:     ${summary.errors}`);
}
