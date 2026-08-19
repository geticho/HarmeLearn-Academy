import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, quizzes } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

/** GET /api/admin/questions?quizId=... - admin only question bank. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const quizId = request.nextUrl.searchParams.get("quizId");

    const rows = await db
      .select({
        id: questions.id,
        quizId: questions.quizId,
        questionText: questions.questionText,
        questionType: questions.questionType,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        orderIndex: questions.orderIndex,
        quizTitle: quizzes.title,
      })
      .from(questions)
      .leftJoin(quizzes, eq(quizzes.id, questions.quizId))
      .where(quizId ? eq(questions.quizId, quizId) : undefined)
      .orderBy(asc(questions.orderIndex))
      .limit(500);

    return NextResponse.json({ questions: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List questions error:", error);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/questions
 * Admin only. Adds a question to a quiz and keeps the quiz counter in sync.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const quizId = String(body.quizId || "").trim();
    const questionText = String(body.questionText || "").trim();
    const questionType = String(body.questionType || "") as QuestionType;
    const correctAnswer = String(body.correctAnswer ?? "").trim();

    if (!quizId || !questionText || !questionType) {
      return NextResponse.json(
        { error: "Quiz, question text and question type are required" },
        { status: 400 }
      );
    }

    if (!QUESTION_TYPES.includes(questionType)) {
      return NextResponse.json(
        { error: "Unsupported question type" },
        { status: 400 }
      );
    }

    const quiz = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Validate per question type.
    let options: string[] | null = null;

    if (questionType === "multiple_choice") {
      const provided = Array.isArray(body.options)
        ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [];
      if (provided.length < 2) {
        return NextResponse.json(
          { error: "Multiple choice questions need at least two options" },
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

    // Next order index within the quiz.
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(eq(questions.quizId, quizId));
    const orderIndex = (existing[0]?.count ?? 0) + 1;

    const [question] = await db
      .insert(questions)
      .values({
        quizId,
        questionText,
        questionType,
        options: options as never,
        correctAnswer: questionType === "essay" ? correctAnswer || "" : correctAnswer,
        explanation: body.explanation || null,
        orderIndex,
      })
      .returning();

    await db
      .update(quizzes)
      .set({ totalQuestions: orderIndex, updatedAt: new Date() })
      .where(eq(quizzes.id, quizId));

    await logAudit({
      actorId: admin.id,
      action: "question.create",
      entityType: "question",
      entityId: question.id,
      details: { quizId, questionType },
    });

    return NextResponse.json(
      { message: "Question added", question },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
