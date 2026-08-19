import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  pastExamQuestions,
  pastExamResults,
  pastExams,
  students,
} from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/past-exams/[examId]/submit
 * Student only. Auto-grades the online past exam and returns per-question
 * feedback: the student's answer, the correct answer and the explanation.
 * Grade-locked.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { examId } = await params;
    const body = await request.json();

    const [exam] = await db
      .select()
      .from(pastExams)
      .where(eq(pastExams.id, examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Past exam not found" }, { status: 404 });
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

    if (exam.grade !== student.grade) {
      return NextResponse.json(
        {
          error: `This exam is for Grade ${exam.grade} students. You are a Grade ${student.grade} student.`,
        },
        { status: 403 }
      );
    }

    const allQuestions = await db
      .select()
      .from(pastExamQuestions)
      .where(eq(pastExamQuestions.pastExamId, examId));

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "This exam has no online questions yet" },
        { status: 400 }
      );
    }

    const given = new Map<string, unknown>();
    if (Array.isArray(body.answers)) {
      for (const a of body.answers as { questionId?: string; answer?: unknown }[]) {
        if (a?.questionId) given.set(a.questionId, a.answer);
      }
    }

    const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();

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
        feedback[q.id] = {
          given: studentAnswer ?? "",
          correct: null,
          correctAnswer: "",
          explanation: "Essay — submitted for your teacher to grade.",
        };
        continue;
      }

      autoGraded++;
      const isCorrect = normalize(studentAnswer) === normalize(correctAnswer);
      if (isCorrect) score++;

      feedback[q.id] = {
        given: studentAnswer ?? "",
        correct: isCorrect,
        correctAnswer,
        explanation: q.explanation,
      };
    }

    const percentage =
      autoGraded === 0 ? 0 : Math.round((score / autoGraded) * 100);
    const passed = percentage >= 50;

    await db.insert(pastExamResults).values({
      studentId: student.id,
      pastExamId: examId,
      score,
      totalQuestions: allQuestions.length,
      percentage: String(percentage),
      passed,
      answers: feedback as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      result: { score, autoGraded, totalQuestions: allQuestions.length, percentage, passed },
      feedback,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Submit past exam error:", error);
    return NextResponse.json({ error: "Failed to submit exam" }, { status: 500 });
  }
}
