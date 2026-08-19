import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const SCOPES: Record<string, string[]> = {
  students: ["student"],
  teachers: ["teacher"],
  all: ["student", "teacher"],
};

/**
 * POST /api/admin/users/delete-all  { scope: "students" | "teachers" | "all" }
 * SUPER ADMIN ONLY. Permanently deletes every registered student/teacher
 * account (cascades to profiles, sessions, results, submissions…).
 * Administrator accounts are never touched.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can wipe registered accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const scope = String(body.scope || "");
    const roles = SCOPES[scope];

    if (!roles) {
      return NextResponse.json(
        { error: 'scope must be "students", "teachers" or "all"' },
        { status: 400 }
      );
    }

    const target = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(inArray(users.role, roles as never));

    if (target.length > 0) {
      await db.delete(users).where(
        inArray(
          users.id,
          target.map((t) => t.id)
        )
      );
    }

    await logAudit({
      actorId: admin.id,
      action: "users.delete_all",
      entityType: "user",
      details: { scope, deleted: target.length },
    });

    return NextResponse.json({
      message: `Deleted ${target.length} registered account(s).`,
      deleted: target.length,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete all users error:", error);
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 });
  }
}
