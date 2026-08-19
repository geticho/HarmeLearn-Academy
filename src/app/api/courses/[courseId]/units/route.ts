import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authErrorResponse, requireAdmin } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const allUnits = await db
      .select()
      .from(units)
      .where(eq(units.courseId, courseId))
      .orderBy((t) => t.orderIndex);

    return NextResponse.json(
      {
        units: allUnits,
        total: allUnits.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get units error:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await requireAdmin();
    const { courseId } = await params;
    const body = await request.json();
    const { title, description, orderIndex } = body;

    if (!title || orderIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newUnit] = await db
      .insert(units)
      .values({
        courseId,
        title,
        description,
        orderIndex,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Unit created successfully",
        unit: newUnit,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create unit error:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    );
  }
}
