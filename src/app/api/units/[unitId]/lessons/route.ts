import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authErrorResponse, requireAdmin } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.unitId, unitId))
      .orderBy((t) => t.orderIndex);

    return NextResponse.json(
      {
        lessons: allLessons,
        total: allLessons.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get lessons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    await requireAdmin();
    const { unitId } = await params;
    const body = await request.json();
    const { title, description, content, orderIndex, durationMinutes } = body;

    if (!title || orderIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newLesson] = await db
      .insert(lessons)
      .values({
        unitId,
        title,
        description,
        content,
        orderIndex,
        durationMinutes,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Lesson created successfully",
        lesson: newLesson,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create lesson error:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
