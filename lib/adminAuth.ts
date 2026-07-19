import { getUserFromRequest, type AuthedUser } from "./auth";
import { createServiceRoleClient } from "./supabase/server";

// Admin gate for every /api/admin/* route. The role check reads the
// database, never the token — a JWT can't claim its way in.
export async function requireAdmin(req: Request): Promise<AuthedUser | null> {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin" ? user : null;
}
