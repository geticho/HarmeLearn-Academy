import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pastExamQuestions, pastExams, students } from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/past-exams/[examId]/offline-pack
 * Student only. Full past-exam pack with answers for offline taking/grading.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const user = await requireRole(["student"]);
    const { examId } = await params;

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
          error: `This exam is for Grade ${exam.grade}. You are Grade ${student.grade}.`,
        },
        { status: 403 }
      );
    }

    const questionRows = await db
      .select({
        id: pastExamQuestions.id,
        questionText: pastExamQuestions.questionText,
        questionType: pastExamQuestions.questionType,
        options: pastExamQuestions.options,
        orderIndex: pastExamQuestions.orderIndex,
        correctAnswer: pastExamQuestions.correctAnswer,
        explanation: pastExamQuestions.explanation,
      })
      .from(pastExamQuestions)
      .where(eq(pastExamQuestions.pastExamId, examId))
      .orderBy(asc(pastExamQuestions.orderIndex));

    return NextResponse.json({
      pack: {
        kind: "exam",
        id: exam.id,
        title: exam.title,
        description: exam.description,
        year: exam.year,
        fileUrl: exam.fileUrl,
        passingScore: 50,
        totalQuestions: questionRows.length,
        questions: questionRows,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Offline exam pack error:", error);
    return NextResponse.json(
      { error: "Failed to build offline exam pack" },
      { status: 500 }
    );
  }
}
