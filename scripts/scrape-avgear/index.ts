import { config } from 'dotenv';
config({ path: '.env.local' });

import { runShopifyScraper } from '../lib/shopifyScraper.js';

runShopifyScraper({
  label: 'avgear-scraper',
  source: 'avgear',
  sitemapUrl: 'https://www.avgear.com/sitemap.xml',
  excludeVendors: ['AVGear.com', 'AVGear'],
});
