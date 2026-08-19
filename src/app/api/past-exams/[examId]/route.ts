import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pastExamQuestions, pastExams, students } from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/past-exams/[examId]
 * Student only. Returns the online past exam and its questions WITHOUT the
 * correct answers (revealed only after submission). Grade-locked.
 */
export async function GET(
  request: NextRequest,
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
          error: `This exam is for Grade ${exam.grade} students. You are a Grade ${student.grade} student.`,
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
      })
      .from(pastExamQuestions)
      .where(eq(pastExamQuestions.pastExamId, examId))
      .orderBy(asc(pastExamQuestions.orderIndex));

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        year: exam.year,
        fileUrl: exam.fileUrl,
        totalQuestions: questionRows.length,
      },
      questions: questionRows,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get past exam error:", error);
    return NextResponse.json({ error: "Failed to load exam" }, { status: 500 });
  }
}
