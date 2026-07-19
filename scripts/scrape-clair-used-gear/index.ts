import { config } from 'dotenv';
config({ path: '.env.local' });

import { runShopifyScraper } from '../lib/shopifyScraper.js';

runShopifyScraper({
  label: 'clair-used-gear-scraper',
  source: 'clair_used_gear',
  sitemapUrl: 'https://clairusedgear.com/sitemap.xml',
  excludeVendors: ['Clair Used Gear', 'ClairUsedGear.com', 'Clair Global'],
});
