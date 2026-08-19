import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, videos } from "@/db/schema";
import { authErrorResponse, logAudit, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/videos - admin only listing with the parent lesson title. */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        isPublished: videos.isPublished,
        createdAt: videos.createdAt,
        lessonId: videos.lessonId,
        lessonTitle: lessons.title,
      })
      .from(videos)
      .leftJoin(lessons, eq(lessons.id, videos.lessonId))
      .orderBy(desc(videos.createdAt))
      .limit(200);

    return NextResponse.json({ videos: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List videos error:", error);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}

/** POST /api/admin/videos - only an administrator may add video content. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const title = String(body.title || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const lessonId = String(body.lessonId || "").trim();

    if (!title || !videoUrl || !lessonId) {
      return NextResponse.json(
        { error: "Lesson, title and video URL are required" },
        { status: 400 }
      );
    }

    if (!/^https?:\/\//i.test(videoUrl)) {
      return NextResponse.json(
        { error: "Video URL must start with http:// or https://" },
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

    const [video] = await db
      .insert(videos)
      .values({
        lessonId,
        title,
        description: body.description || null,
        videoUrl,
        duration: body.duration ? Number(body.duration) : null,
        thumbnail: body.thumbnail || null,
        isPublished: body.isPublished ?? true,
      })
      .returning();

    await logAudit({
      actorId: admin.id,
      action: "video.create",
      entityType: "video",
      entityId: video.id,
      details: { title, lessonId },
    });

    return NextResponse.json({ message: "Video added", video }, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create video error:", error);
    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
  }
}
