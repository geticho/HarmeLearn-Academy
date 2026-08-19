import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, quizzes, units } from "@/db/schema";
import { generateSlug } from "@/lib/utils";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/structure
 * Admin only. Creates the course skeleton that content hangs off:
 * body.type = "course" | "unit" | "lesson" | "quiz".
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const type = String(body.type || "");

    if (type === "course") {
      const title = String(body.title || "").trim();
      if (!title || !body.subjectId || !body.grade || !body.teacherId) {
        return NextResponse.json(
          { error: "Title, subject, grade and teacher are required" },
          { status: 400 }
        );
      }

      const [course] = await db
        .insert(courses)
        .values({
          title,
          slug: `${generateSlug(title)}-${Date.now().toString(36)}`,
          description: body.description || null,
          subjectId: body.subjectId,
          grade: body.grade,
          teacherId: body.teacherId,
          price: body.price ? String(body.price) : "0",
          isFree: body.isFree ?? true,
          isPublished: body.isPublished ?? false,
        })
        .returning();

      await logAudit({
        actorId: admin.id,
        action: "course.create",
        entityType: "course",
        entityId: course.id,
        details: { title },
      });

      return NextResponse.json({ message: "Course created", course }, { status: 201 });
    }

    if (type === "unit") {
      const title = String(body.title || "").trim();
      if (!title || !body.courseId) {
        return NextResponse.json(
          { error: "Course and unit title are required" },
          { status: 400 }
        );
      }

      const count = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(units)
        .where(eq(units.courseId, body.courseId));

      const [unit] = await db
        .insert(units)
        .values({
          courseId: body.courseId,
          title,
          description: body.description || null,
          orderIndex: (count[0]?.count ?? 0) + 1,
        })
        .returning();

      await logAudit({
        actorId: admin.id,
        action: "unit.create",
        entityType: "unit",
        entityId: unit.id,
      });

      return NextResponse.json({ message: "Unit created", unit }, { status: 201 });
    }

    if (type === "lesson") {
      const title = String(body.title || "").trim();
      if (!title || !body.unitId) {
        return NextResponse.json(
          { error: "Unit and lesson title are required" },
          { status: 400 }
        );
      }

      const count = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(lessons)
        .where(eq(lessons.unitId, body.unitId));

      const [lesson] = await db
        .insert(lessons)
        .values({
          unitId: body.unitId,
          title,
          description: body.description || null,
          content: body.content || null,
          durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : null,
          orderIndex: (count[0]?.count ?? 0) + 1,
        })
        .returning();

      // Keep the unit counter in sync.
      await db
        .update(units)
        .set({ totalLessons: (count[0]?.count ?? 0) + 1, updatedAt: new Date() })
        .where(eq(units.id, body.unitId));

      await logAudit({
        actorId: admin.id,
        action: "lesson.create",
        entityType: "lesson",
        entityId: lesson.id,
      });

      return NextResponse.json({ message: "Lesson created", lesson }, { status: 201 });
    }

    if (type === "quiz") {
      const title = String(body.title || "").trim();
      if (!title || !body.lessonId) {
        return NextResponse.json(
          { error: "Lesson and quiz title are required" },
          { status: 400 }
        );
      }

      const [quiz] = await db
        .insert(quizzes)
        .values({
          lessonId: body.lessonId,
          title,
          description: body.description || null,
          passingScore: body.passingScore ? Number(body.passingScore) : 60,
          timeLimit: body.timeLimit ? Number(body.timeLimit) : null,
        })
        .returning();

      await logAudit({
        actorId: admin.id,
        action: "quiz.create",
        entityType: "quiz",
        entityId: quiz.id,
      });

      return NextResponse.json({ message: "Quiz created", quiz }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown structure type" }, { status: 400 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create structure error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
