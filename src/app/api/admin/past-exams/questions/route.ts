import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pastExamQuestions, pastExams } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const TYPES = ["multiple_choice", "true_false", "short_answer", "essay"] as const;

/**
 * POST /api/admin/past-exams/questions
 * Admin only. Adds a question to an online past exam with the correct
 * answer, wrong answers (options) and an explanation.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const pastExamId = String(body.pastExamId || "").trim();
    const questionText = String(body.questionText || "").trim();
    const questionType = String(body.questionType || "") as (typeof TYPES)[number];
    const correctAnswer = String(body.correctAnswer ?? "").trim();

    if (!pastExamId || !questionText || !TYPES.includes(questionType)) {
      return NextResponse.json(
        { error: "Past exam, question text and question type are required" },
        { status: 400 }
      );
    }

    const exam = await db
      .select({ id: pastExams.id })
      .from(pastExams)
      .where(eq(pastExams.id, pastExamId))
      .limit(1);

    if (exam.length === 0) {
      return NextResponse.json({ error: "Past exam not found" }, { status: 404 });
    }

    let options: string[] | null = null;

    if (questionType === "multiple_choice") {
      const provided = Array.isArray(body.options)
        ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [];
      if (provided.length < 2) {
        return NextResponse.json(
          { error: "Multiple choice questions need at least two options (one correct, one or more wrong)" },
          { status: 400 }
        );
      }
      if (!provided.includes(correctAnswer)) {
        return NextResponse.json(
          { error: "The correct answer must match one of the options" },
          { status: 400 }
        );
      }
      options = provided;
    } else if (questionType === "true_false") {
      if (!["true", "false"].includes(correctAnswer.toLowerCase())) {
        return NextResponse.json(
          { error: "True/False answer must be 'true' or 'false'" },
          { status: 400 }
        );
      }
      options = ["true", "false"];
    } else if (questionType === "short_answer" && !correctAnswer) {
      return NextResponse.json(
        { error: "Short answer questions need a model answer" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(pastExamQuestions)
      .where(eq(pastExamQuestions.pastExamId, pastExamId));

    const [question] = await db
      .insert(pastExamQuestions)
      .values({
        pastExamId,
        questionText,
        questionType,
        options: options as never,
        correctAnswer: correctAnswer || "",
        explanation: body.explanation || null,
        orderIndex: (existing[0]?.n ?? 0) + 1,
      })
      .returning();

    await db
      .update(pastExams)
      .set({ totalQuestions: (existing[0]?.n ?? 0) + 1, updatedAt: new Date() })
      .where(eq(pastExams.id, pastExamId));

    await logAudit({
      actorId: admin.id,
      action: "past_exam_question.create",
      entityType: "past_exam_question",
      entityId: question.id,
      details: { pastExamId, questionType },
    });

    return NextResponse.json(
      { message: "Question added to the past exam", question },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Add past exam question error:", error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
