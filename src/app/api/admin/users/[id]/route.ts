import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

function generateTempPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).slice(2, 4);
  return `Harme-${digits}-${suffix}`;
}

/**
 * PATCH /api/admin/users/[id]
 * Admin only. Update profile, toggle access, or reset the password.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const target = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (target.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only a Super Admin may modify another administrator.
    if (
      admin.role !== "super_admin" &&
      ["super_admin", "school_admin"].includes(target[0].role)
    ) {
      return NextResponse.json(
        { error: "You cannot modify an administrator account" },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    let temporaryPassword: string | undefined;

    if (typeof body.firstName === "string") updates.firstName = body.firstName.trim();
    if (typeof body.lastName === "string") updates.lastName = body.lastName.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    if (body.resetPassword) {
      const nextPassword: string =
        typeof body.newPassword === "string" && body.newPassword
          ? body.newPassword
          : generateTempPassword();
      const strength = validatePasswordStrength(nextPassword);
      if (!strength.isValid) {
        return NextResponse.json(
          { error: "Weak password", details: strength.errors },
          { status: 400 }
        );
      }
      updates.passwordHash = hashPassword(nextPassword);
      temporaryPassword = nextPassword;
    }

    await db.update(users).set(updates).where(eq(users.id, id));

    // Student-specific fields live on their own table.
    if (target[0].role === "student" && (body.grade || body.stream)) {
      const studentUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (body.grade) studentUpdates.grade = body.grade;
      if (body.stream) studentUpdates.stream = body.stream;
      await db.update(students).set(studentUpdates).where(eq(students.userId, id));
    }

    await logAudit({
      actorId: admin.id,
      action: body.resetPassword ? "user.reset_password" : "user.update",
      entityType: "user",
      entityId: id,
      details: { isActive: body.isActive },
    });

    return NextResponse.json({
      message: "User updated",
      temporaryPassword,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Super Admin only. Cascades to the student/teacher profile.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can delete accounts" },
        { status: 403 }
      );
    }

    if (admin.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, id));

    await logAudit({
      actorId: admin.id,
      action: "user.delete",
      entityType: "user",
      entityId: id,
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
