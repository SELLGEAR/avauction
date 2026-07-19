// One-time seed of the zip_codes centroid table from the US Census
// Bureau's ZCTA gazetteer (public domain). Idempotent — upserts on zip.
// Run with: npx tsx scripts/seed-zipcodes.ts
//
// The distance features work without this for any zip already present;
// searches simply treat unknown zips as no-distance.

import { config } from 'dotenv';
config({ path: '.env.local' });

import AdmZip from 'adm-zip';
import { getSupabaseClient } from './lib/supabaseClient.js';

const GAZETTEER_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip';

async function main() {
  const db = getSupabaseClient();

  console.log(`Downloading Census ZCTA gazetteer...`);
  const res = await fetch(GAZETTEER_URL);
  if (!res.ok) throw new Error(`gazetteer download failed: ${res.status}`);
  const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
  const entry = zip.getEntries().find((e) => e.entryName.endsWith('.txt'));
  if (!entry) throw new Error('no .txt entry in gazetteer zip');

  // Tab-separated: GEOID  ALAND  AWATER  ALAND_SQMI  AWATER_SQMI  INTPTLAT  INTPTLONG
  const lines = entry.getData().toString('utf-8').split('\n');
  const header = lines[0].split('\t').map((h) => h.trim());
  const geoidIdx = header.indexOf('GEOID');
  const latIdx = header.indexOf('INTPTLAT');
  const lngIdx = header.indexOf('INTPTLONG');
  if (geoidIdx < 0 || latIdx < 0 || lngIdx < 0) {
    throw new Error(`unexpected gazetteer header: ${header.join(',')}`);
  }

  const rows: { zip: string; lat: number; lng: number }[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split('\t');
    if (cols.length <= Math.max(geoidIdx, latIdx, lngIdx)) continue;
    const zipCode = cols[geoidIdx].trim();
    const lat = Number(cols[latIdx]);
    const lng = Number(cols[lngIdx]);
    if (!/^\d{5}$/.test(zipCode) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    rows.push({ zip: zipCode, lat, lng });
  }
  console.log(`Parsed ${rows.length} ZCTA centroids. Upserting in batches...`);

  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await db
      .from('zip_codes')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'zip' });
    if (error) throw new Error(`upsert failed at batch ${i / BATCH}: ${error.message}`);
    if ((i / BATCH) % 10 === 0) console.log(`  ${i + Math.min(BATCH, rows.length - i)} / ${rows.length}`);
  }

  console.log(`Done — ${rows.length} zip centroids loaded.`);
}

main().catch((e) => {
  console.error('seed failed:', e);
  process.exit(1);
});
