import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessons,
  questions,
  quizzes,
  students,
  units,
} from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/quizzes/[quizId]
 * Student only. Returns the quiz and its questions WITHOUT the correct
 * answers (those are only revealed after submission).
 * Grade-locked: only students whose grade matches the quiz's course grade.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { quizId } = await params;

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Resolve course grade: quiz → lesson → unit → course.
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, quiz.lessonId))
      .limit(1);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, lesson.unitId))
      .limit(1);
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, unit.courseId))
      .limit(1);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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

    if (course.grade !== student.grade) {
      return NextResponse.json(
        {
          error: `This quiz belongs to a Grade ${course.grade} course. You are a Grade ${student.grade} student.`,
        },
        { status: 403 }
      );
    }

    const questionRows = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        questionType: questions.questionType,
        options: questions.options,
        orderIndex: questions.orderIndex,
      })
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(asc(questions.orderIndex));

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        courseTitle: course.title,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        totalQuestions: questionRows.length,
      },
      questions: questionRows,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get quiz error:", error);
    return NextResponse.json({ error: "Failed to load quiz" }, { status: 500 });
  }
}
