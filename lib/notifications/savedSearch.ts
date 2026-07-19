import { createServiceRoleClient } from "../supabase/server";
import { sendTransactional } from "./loops";

// Saved search alert per CLAUDE.md: "Saved search alert — matching listing
// goes live." Call from the admin approval endpoint at the moment a
// listing transitions to active. The SQL matcher applies a one-hour
// re-alert guard per search.
export async function alertsForListing(listingId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data: matches, error } = await supabase.rpc("saved_search_matches_for_listing", {
    p_listing_id: listingId,
  });
  if (error) throw new Error(`saved_search_matches_for_listing failed: ${error.message}`);

  const rows = (matches ?? []) as {
    search_id: string;
    buyer_id: string;
    email: string;
    search_name: string | null;
  }[];
  if (rows.length === 0) return 0;

  const { data: listing } = await supabase
    .from("listings")
    .select("title, asking_price, current_bid, listing_type")
    .eq("id", listingId)
    .single();

  for (const m of rows) {
    await sendTransactional("saved-search-match", m.email, {
      searchName: m.search_name ?? "your saved search",
      listingTitle: listing?.title ?? "a new listing",
      listingUrl: `https://avauction.com/listings/${listingId}`,
      price: Number(listing?.current_bid ?? listing?.asking_price ?? 0),
    });
  }

  await supabase
    .from("saved_searches")
    .update({ last_alerted_at: new Date().toISOString() })
    .in("id", rows.map((m) => m.search_id));

  return rows.length;
}
