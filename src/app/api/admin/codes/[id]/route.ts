import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { registrationCodes } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/codes/[id] { isActive } - enable/disable a code. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive (boolean) is required" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(registrationCodes)
      .set({ isActive: body.isActive })
      .where(eq(registrationCodes.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    await logAudit({
      actorId: admin.id,
      action: body.isActive ? "code.enable" : "code.disable",
      entityType: "registration_code",
      entityId: id,
    });

    return NextResponse.json({
      message: body.isActive ? "Code activated" : "Code deactivated",
      code: updated[0],
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update code error:", error);
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  }
}

/** DELETE /api/admin/codes/[id] - remove a code. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    await db.delete(registrationCodes).where(eq(registrationCodes.id, id));

    await logAudit({
      actorId: admin.id,
      action: "code.delete",
      entityType: "registration_code",
      entityId: id,
    });

    return NextResponse.json({ message: "Code deleted" });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete code error:", error);
    return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  }
}
