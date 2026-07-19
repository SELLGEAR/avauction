import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { resolveEquipment } from "@/lib/admin/equipmentQueue";

// POST /api/admin/equipment-queue/[id] — { action: 'link_existing' |
// 'approve_new' | 'reject', master_equipment_id?, manufacturer?, model? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const action = body.action;
  if (action !== "link_existing" && action !== "approve_new" && action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  try {
    const result = await resolveEquipment(admin.id, id, action, {
      masterEquipmentId:
        typeof body.master_equipment_id === "string" ? body.master_equipment_id : undefined,
      manufacturer: typeof body.manufacturer === "string" ? body.manufacturer : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    console.error("equipment resolution failed:", e);
    return NextResponse.json({ error: "resolution_failed" }, { status: 500 });
  }
}
