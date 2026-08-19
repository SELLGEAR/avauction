import type { Metadata } from "next";

// Product/listing detail pages are noindexed at launch per CLAUDE.md (SEO
// Structural Advantage): with market_prices empty the pages have nothing
// unique to rank on, and the browse/category pages carry the SEO load.
// This lives in a layout because page.tsx is a client component and can't
// export metadata. Remove when the gate in CLAUDE.md reopens indexing.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
