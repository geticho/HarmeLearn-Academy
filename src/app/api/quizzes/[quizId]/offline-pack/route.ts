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
 * GET /api/quizzes/[quizId]/offline-pack
 * Student only. Returns a full quiz pack INCLUDING correct answers so the
 * student can take and grade the quiz offline on their device.
 */
export async function GET(
  _request: NextRequest,
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
          error: `This quiz belongs to Grade ${course.grade}. You are Grade ${student.grade}.`,
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
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
      })
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(asc(questions.orderIndex));

    return NextResponse.json({
      pack: {
        kind: "quiz",
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        courseTitle: course.title,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        totalQuestions: questionRows.length,
        questions: questionRows,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Offline quiz pack error:", error);
    return NextResponse.json(
      { error: "Failed to build offline quiz pack" },
      { status: 500 }
    );
  }
}
