import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessons,
  questions,
  quizResults,
  quizzes,
  students,
  units,
} from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const AUTO_GRADED = ["multiple_choice", "true_false", "short_answer"];

interface AnswerInput {
  questionId?: string;
  answer?: unknown;
}

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * POST /api/quizzes/[quizId]/submit
 * Student only. body: { answers: [{ questionId, answer }] }
 * Auto-grades multiple choice, true/false and short answer; essay questions
 * are flagged for teacher review and excluded from the automatic score.
 * Grade-locked like the GET endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { quizId } = await params;
    const body = await request.json();

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Same grade lock as GET.
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

    const allQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId));

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "This quiz has no questions yet" },
        { status: 400 }
      );
    }

    // Map provided answers.
    const given = new Map<string, unknown>();
    if (Array.isArray(body.answers)) {
      for (const a of body.answers as AnswerInput[]) {
        if (a?.questionId) given.set(a.questionId, a.answer);
      }
    }

    // Grade each question.
    let score = 0;
    let autoGraded = 0;
    const feedback: Record<
      string,
      {
        given: unknown;
        correct: boolean | null;
        correctAnswer: string;
        explanation: string | null;
      }
    > = {};

    for (const q of allQuestions) {
      const studentAnswer = given.get(q.id);
      const correctAnswer = q.correctAnswer ?? "";

      if (q.questionType === "essay") {
        // Not auto-graded — teacher review.
        feedback[q.id] = {
          given: studentAnswer ?? "",
          correct: null,
          correctAnswer: "",
          explanation: "Essay — submitted for your teacher to grade.",
        };
        continue;
      }

      autoGraded++;
      const isCorrect =
        q.questionType === "true_false"
          ? normalize(studentAnswer) === normalize(correctAnswer)
          : normalize(studentAnswer) === normalize(correctAnswer);

      if (isCorrect) score++;

      feedback[q.id] = {
        given: studentAnswer ?? "",
        correct: isCorrect,
        correctAnswer,
        explanation: q.explanation,
      };
    }

    const totalQuestions = allQuestions.length;
    const percentage =
      autoGraded === 0
        ? 0
        : Math.round((score / autoGraded) * 100);
    const passed = percentage >= (quiz.passingScore ?? 60);

    const answersJson = feedback as unknown as Record<string, unknown>;

    await db.insert(quizResults).values({
      studentId: student.id,
      quizId,
      score,
      totalQuestions,
      percentage: String(percentage),
      passed,
      answers: answersJson,
    });

    return NextResponse.json({
      result: {
        score,
        autoGraded,
        totalQuestions,
        percentage,
        passed,
        passingScore: quiz.passingScore,
      },
      feedback,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
