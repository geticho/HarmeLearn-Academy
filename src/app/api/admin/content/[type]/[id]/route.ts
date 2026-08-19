import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  pastExams,
  pdfs,
  questions,
  quizzes,
  shortNotes,
  subjects,
  videos,
} from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/content/[type]/[id]
 * Admin only. Removes a single piece of content.
 * type = video | pdf | question | quiz | subject
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { type, id } = await params;

    switch (type) {
      case "video":
        await db.delete(videos).where(eq(videos.id, id));
        break;
      case "pdf":
        await db.delete(pdfs).where(eq(pdfs.id, id));
        break;
      case "question":
        await db.delete(questions).where(eq(questions.id, id));
        break;
      case "quiz":
        await db.delete(quizzes).where(eq(quizzes.id, id));
        break;
      case "subject":
        await db.delete(subjects).where(eq(subjects.id, id));
        break;
      case "note":
        await db.delete(shortNotes).where(eq(shortNotes.id, id));
        break;
      case "past_exam":
        await db.delete(pastExams).where(eq(pastExams.id, id));
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported content type" },
          { status: 400 }
        );
    }

    await logAudit({
      actorId: admin.id,
      action: `${type}.delete`,
      entityType: type,
      entityId: id,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete content error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
