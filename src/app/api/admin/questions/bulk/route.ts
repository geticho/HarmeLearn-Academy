import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questions, quizzes } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const TYPES = ["multiple_choice", "true_false", "short_answer", "essay"] as const;
type QType = (typeof TYPES)[number];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * POST /api/admin/questions/bulk
 * Admin only. Accepts a CSV file (multipart/form-data, field "file") plus a
 * "quizId" field, and creates one question per data row.
 *
 * Expected columns (header row required, case-sensitive):
 *   questionText,questionType,option1,option2,option3,option4,correctAnswer,explanation
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const quizId = String(formData.get("quizId") || "").trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const quiz = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    if (quiz.length === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one question row" },
        { status: 400 }
      );
    }

    const header = rows[0].map((h) => h.trim());
    const required = [
      "questionText",
      "questionType",
      "option1",
      "option2",
      "option3",
      "option4",
      "correctAnswer",
      "explanation",
    ];
    const missingCols = required.filter((col) => !header.includes(col));
    if (missingCols.length > 0) {
      return NextResponse.json(
        { error: `CSV is missing required columns: ${missingCols.join(", ")}` },
        { status: 400 }
      );
    }

    const colIndex = (name: string) => header.indexOf(name);

    const existingCountRow = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(eq(questions.quizId, quizId));
    let orderIndex = existingCountRow[0]?.count ?? 0;

    const created: string[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const rowNum = i + 1;

      const questionText = (cols[colIndex("questionText")] || "").trim();
      const questionType = (cols[colIndex("questionType")] || "").trim() as QType;
      const correctAnswer = (cols[colIndex("correctAnswer")] || "").trim();
      const explanation = (cols[colIndex("explanation")] || "").trim() || null;

      if (!questionText || !TYPES.includes(questionType)) {
        errors.push({ row: rowNum, error: "Missing question text or invalid question type" });
        continue;
      }

      let options: string[] | null = null;

      if (questionType === "multiple_choice") {
        const rawOptions = [
          cols[colIndex("option1")],
          cols[colIndex("option2")],
          cols[colIndex("option3")],
          cols[colIndex("option4")],
        ]
          .map((o) => (o || "").trim())
          .filter(Boolean);

        if (rawOptions.length < 2) {
          errors.push({ row: rowNum, error: "Needs at least two options" });
          continue;
        }
        if (!rawOptions.includes(correctAnswer)) {
          errors.push({ row: rowNum, error: "correctAnswer must match one of the options" });
          continue;
        }
        options = rawOptions;
      } else if (questionType === "true_false") {
        if (!["true", "false"].includes(correctAnswer.toLowerCase())) {
          errors.push({ row: rowNum, error: "correctAnswer must be 'true' or 'false'" });
          continue;
        }
        options = ["true", "false"];
      } else if (questionType === "short_answer" && !correctAnswer) {
        errors.push({ row: rowNum, error: "Short answer needs a model answer" });
        continue;
      }

      orderIndex += 1;

      const [question] = await db
        .insert(questions)
        .values({
          quizId,
          questionText,
          questionType,
          options: options as never,
          correctAnswer: questionType === "essay" ? correctAnswer || "" : correctAnswer,
          explanation,
          orderIndex,
        })
        .returning({ id: questions.id });

      created.push(question.id);
    }

    if (created.length > 0) {
      await db
        .update(quizzes)
        .set({ totalQuestions: orderIndex, updatedAt: new Date() })
        .where(eq(quizzes.id, quizId));

      await logAudit({
        actorId: admin.id,
        action: "question.bulk_create",
        entityType: "question",
        entityId: quizId,
        details: { count: created.length, errors: errors.length },
      });
    }

    return NextResponse.json({
      message: `${created.length} question(s) added${errors.length ? `, ${errors.length} row(s) skipped` : ""}`,
      createdCount: created.length,
      errors,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Bulk upload quiz questions error:", error);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}
