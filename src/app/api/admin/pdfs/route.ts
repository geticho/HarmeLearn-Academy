import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, pdfs } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/pdfs - admin only listing with the parent lesson title. */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: pdfs.id,
        title: pdfs.title,
        description: pdfs.description,
        fileUrl: pdfs.fileUrl,
        pages: pdfs.pages,
        fileSize: pdfs.fileSize,
        isPublished: pdfs.isPublished,
        createdAt: pdfs.createdAt,
        lessonId: pdfs.lessonId,
        lessonTitle: lessons.title,
      })
      .from(pdfs)
      .leftJoin(lessons, eq(lessons.id, pdfs.lessonId))
      .orderBy(desc(pdfs.createdAt))
      .limit(200);

    return NextResponse.json({ pdfs: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List pdfs error:", error);
    return NextResponse.json({ error: "Failed to load PDFs" }, { status: 500 });
  }
}

/** POST /api/admin/pdfs - only an administrator may add PDF material. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const fileUrl = String(body.fileUrl || "").trim();
    const lessonId = String(body.lessonId || "").trim();

    if (!title || !fileUrl || !lessonId) {
      return NextResponse.json(
        { error: "Lesson, title and file URL are required" },
        { status: 400 }
      );
    }

    if (!/^https?:\/\//i.test(fileUrl)) {
      return NextResponse.json(
        { error: "File URL must start with http:// or https://" },
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

    const [pdf] = await db
      .insert(pdfs)
      .values({
        lessonId,
        title,
        description: body.description || null,
        fileUrl,
        pages: body.pages ? Number(body.pages) : null,
        fileSize: body.fileSize ? Number(body.fileSize) : null,
        isPublished: body.isPublished ?? true,
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "pdf.create",
      entityType: "pdf",
      entityId: pdf.id,
      details: { title, lessonId },
    });

    return NextResponse.json({ message: "PDF added", pdf }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create pdf error:", error);
    return NextResponse.json({ error: "Failed to add PDF" }, { status: 500 });
  }
}
