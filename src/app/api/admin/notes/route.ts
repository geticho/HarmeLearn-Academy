import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, shortNotes } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/notes - admin only listing with parent lesson title. */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: shortNotes.id,
        title: shortNotes.title,
        content: shortNotes.content,
        isPublished: shortNotes.isPublished,
        createdAt: shortNotes.createdAt,
        lessonId: shortNotes.lessonId,
        lessonTitle: lessons.title,
      })
      .from(shortNotes)
      .leftJoin(lessons, eq(lessons.id, shortNotes.lessonId))
      .orderBy(desc(shortNotes.createdAt))
      .limit(200);

    return NextResponse.json({ notes: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List notes error:", error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

/** POST /api/admin/notes - only an administrator may add short notes. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const lessonId = String(body.lessonId || "").trim();

    if (!title || !content || !lessonId) {
      return NextResponse.json(
        { error: "Lesson, title and note content are required" },
        { status: 400 }
      );
    }

    const lesson = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const [note] = await db
      .insert(shortNotes)
      .values({
        lessonId,
        title,
        content,
        isPublished: body.isPublished ?? true,
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "note.create",
      entityType: "note",
      entityId: note.id,
      details: { title, lessonId },
    });

    return NextResponse.json({ message: "Short note added", note }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
