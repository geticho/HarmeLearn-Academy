import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessons,
  quizzes,
  subjects,
  teachers,
  units,
  users,
} from "@/db/schema";
import { authErrorResponse, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/catalog
 * Admin only. One call that returns everything the admin forms need to
 * populate their select boxes (subjects, teachers, courses, units,
 * lessons and quizzes).
 */
export async function GET() {
  try {
    await requireAdmin();

    const [subjectRows, teacherRows, courseRows, unitRows, lessonRows, quizRows] =
      await Promise.all([
        db.select().from(subjects).orderBy(asc(subjects.name)),
        db
          .select({
            id: teachers.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            specialization: teachers.specialization,
          })
          .from(teachers)
          .innerJoin(users, eq(users.id, teachers.userId))
          .orderBy(asc(users.firstName)),
        db
          .select({
            id: courses.id,
            title: courses.title,
            grade: courses.grade,
            subjectId: courses.subjectId,
            teacherId: courses.teacherId,
            isPublished: courses.isPublished,
            totalLessons: courses.totalLessons,
          })
          .from(courses)
          .orderBy(asc(courses.title)),
        db
          .select({
            id: units.id,
            courseId: units.courseId,
            title: units.title,
            orderIndex: units.orderIndex,
          })
          .from(units)
          .orderBy(asc(units.orderIndex)),
        db
          .select({
            id: lessons.id,
            unitId: lessons.unitId,
            title: lessons.title,
            orderIndex: lessons.orderIndex,
          })
          .from(lessons)
          .orderBy(asc(lessons.orderIndex)),
        db
          .select({
            id: quizzes.id,
            lessonId: quizzes.lessonId,
            title: quizzes.title,
            totalQuestions: quizzes.totalQuestions,
          })
          .from(quizzes)
          .orderBy(asc(quizzes.title)),
      ]);

    return NextResponse.json({
      subjects: subjectRows,
      teachers: teacherRows,
      courses: courseRows,
      units: unitRows,
      lessons: lessonRows,
      quizzes: quizRows,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Catalog error:", error);
    return NextResponse.json({ error: "Failed to load catalog" }, { status: 500 });
  }
}
