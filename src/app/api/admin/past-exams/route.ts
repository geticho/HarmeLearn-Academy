import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pastExams, subjects } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/past-exams - admin only listing with subject name. */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: pastExams.id,
        title: pastExams.title,
        grade: pastExams.grade,
        year: pastExams.year,
        description: pastExams.description,
        fileUrl: pastExams.fileUrl,
        isPublished: pastExams.isPublished,
        createdAt: pastExams.createdAt,
        subjectId: pastExams.subjectId,
        subjectName: subjects.name,
      })
      .from(pastExams)
      .leftJoin(subjects, eq(subjects.id, pastExams.subjectId))
      .orderBy(desc(pastExams.createdAt))
      .limit(200);

    return NextResponse.json({ exams: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List past exams error:", error);
    return NextResponse.json(
      { error: "Failed to load past exams" },
      { status: 500 }
    );
  }
}

/** POST /api/admin/past-exams - only an administrator may add a past exam paper. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const fileUrl = String(body.fileUrl || "").trim();
    const subjectId = String(body.subjectId || "").trim();
    const grade = ["9", "10", "11", "12"].includes(body.grade)
      ? body.grade
      : null;

    if (!title || !fileUrl || !subjectId || !grade) {
      return NextResponse.json(
        { error: "Subject, grade, title and file URL are required" },
        { status: 400 }
      );
    }

    if (!/^https?:\/\//i.test(fileUrl)) {
      return NextResponse.json(
        { error: "File URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    const subject = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.id, subjectId))
      .limit(1);

    if (subject.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const [exam] = await db
      .insert(pastExams)
      .values({
        subjectId,
        grade: grade as "9" | "10" | "11" | "12",
        title,
        year: body.year ? Number(body.year) : null,
        description: body.description || null,
        fileUrl,
        isPublished: body.isPublished ?? true,
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "past_exam.create",
      entityType: "past_exam",
      entityId: exam.id,
      details: { title, subjectId, grade },
    });

    return NextResponse.json({ message: "Past exam added", exam }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create past exam error:", error);
    return NextResponse.json({ error: "Failed to add past exam" }, { status: 500 });
  }
}
