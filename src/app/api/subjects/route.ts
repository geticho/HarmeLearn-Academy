import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { asc } from "drizzle-orm";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/subjects - public read. */
export async function GET() {
  try {
    const allSubjects = await db
      .select()
      .from(subjects)
      .orderBy(asc(subjects.name));

    return NextResponse.json(
      { subjects: allSubjects, total: allSubjects.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get subjects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subjects - ADMIN ONLY.
 * Subjects define the national curriculum, so only an administrator
 * may create them.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();

    if (!name || !code || !body.gradeFrom || !body.gradeTo) {
      return NextResponse.json(
        { error: "Name, code, and grade range are required" },
        { status: 400 }
      );
    }

    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
        code,
        description: body.description || null,
        gradeFrom: body.gradeFrom,
        gradeTo: body.gradeTo,
        color: body.color || "#2563eb",
        icon: body.icon || "📘",
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "subject.create",
      entityType: "subject",
      entityId: newSubject.id,
      details: { name, code },
    });

    return NextResponse.json(
      { message: "Subject created successfully", subject: newSubject },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "A subject with that code already exists" },
        { status: 409 }
      );
    }
    console.error("Create subject error:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
