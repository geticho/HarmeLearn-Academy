import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, courseEnrollments, students } from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/enroll  { courseId }
 * Student only.
 *
 * GRADE RULE: a student may only enroll in courses that match their own
 * grade. The grade comes from the database session, never from the client,
 * so a Grade 9 student cannot enroll in Grade 12 courses by editing the
 * request.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["student"]);

    const body = await request.json();
    const courseId = String(body.courseId || "").trim();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: "This course is not open for enrollment yet" },
        { status: 403 }
      );
    }

    // THE GRADE CHECK.
    if (course.grade !== student.grade) {
      return NextResponse.json(
        {
          error: `You are in Grade ${student.grade} and can only enroll in Grade ${student.grade} courses. This course is for Grade ${course.grade}.`,
        },
        { status: 403 }
      );
    }

    // Already enrolled?
    const existing = await db
      .select({ id: courseEnrollments.id })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.studentId, student.id),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "You are already enrolled in this course", enrolled: true },
        { status: 200 }
      );
    }

    await db.insert(courseEnrollments).values({
      studentId: student.id,
      courseId,
    });

    await db
      .update(courses)
      .set({ totalStudents: sql`${courses.totalStudents} + 1` })
      .where(eq(courses.id, courseId));

    return NextResponse.json(
      { message: `Enrolled in ${course.title}`, enrolled: true },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Enroll error:", error);
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
  }
}
