import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { registrationCodes, users } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/** GET /api/admin/codes - admin only. Lists all registration codes. */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: registrationCodes.id,
        code: registrationCodes.code,
        role: registrationCodes.role,
        grade: registrationCodes.grade,
        maxUses: registrationCodes.maxUses,
        usedCount: registrationCodes.usedCount,
        isActive: registrationCodes.isActive,
        expiresAt: registrationCodes.expiresAt,
        createdAt: registrationCodes.createdAt,
        createdByFirst: users.firstName,
        createdByLast: users.lastName,
      })
      .from(registrationCodes)
      .leftJoin(users, eq(users.id, registrationCodes.createdById))
      .orderBy(desc(registrationCodes.createdAt))
      .limit(200);

    return NextResponse.json({ codes: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List codes error:", error);
    return NextResponse.json({ error: "Failed to load codes" }, { status: 500 });
  }
}

/**
 * POST /api/admin/codes  { role, grade?, maxUses?, expiresInDays? }
 * Admin only. Generates a fresh registration code.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const role = body.role === "teacher" ? "teacher" : "student";
    const grade = ["9", "10", "11", "12"].includes(body.grade)
      ? body.grade
      : null;
    const maxUses = Math.min(
      Math.max(parseInt(body.maxUses || "50"), 1),
      10000
    );
    const expiresInDays = parseInt(body.expiresInDays || "0");

    if (role === "student" && !grade) {
      // A grade-less code is allowed, but the admin usually picks one.
    }

    // Generate a unique code (retry a few times on collision).
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db
        .select({ id: registrationCodes.id })
        .from(registrationCodes)
        .where(eq(registrationCodes.code, code))
        .limit(1);
      if (existing.length === 0) break;
      code = generateCode();
    }

    const [created] = await db
      .insert(registrationCodes)
      .values({
        code,
        role,
        grade: grade as "9" | "10" | "11" | "12" | null,
        maxUses,
        createdById: admin.id,
        expiresAt:
          expiresInDays > 0
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null,
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "code.create",
      entityType: "registration_code",
      entityId: created.id,
      details: { code, role, grade, maxUses },
    });

    return NextResponse.json(
      {
        message: `Code ${code} created — share it with your ${role === "teacher" ? "teachers" : "students"}.`,
        code: created,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create code error:", error);
    return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  }
}
