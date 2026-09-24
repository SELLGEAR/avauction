import { getUserFromRequest, type AuthedUser } from "./auth";
import { createServiceRoleClient } from "./supabase/server";

export interface AuthedSeller {
  user: AuthedUser;
  sellerId: string;
}

// Seller gate for /api/seller/* routes: a valid session AND a sellers row.
// Returns null for signed-out or non-seller callers; routes map that to
// 401/403 themselves via requireSellerResponse().
export async function requireSeller(req: Request): Promise<AuthedSeller | { error: "unauthorized" | "not_a_seller" }> {
  const user = await getUserFromRequest(req);
  if (!user) return { error: "unauthorized" };
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
  if (!data) return { error: "not_a_seller" };
  return { user, sellerId: data.id as string };
}

export function sellerErrorStatus(error: "unauthorized" | "not_a_seller"): number {
  return error === "unauthorized" ? 401 : 403;
}
