import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { authErrorResponse, requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const subjectId = searchParams.get("subjectId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [eq(courses.isPublished, true)];

    if (grade) {
      conditions.push(eq(courses.grade, grade as any));
    }

    if (subjectId) {
      conditions.push(eq(courses.subjectId, subjectId));
    }

    const allCourses = await db
      .select()
      .from(courses)
      .where(and(...conditions))
      .orderBy(desc(courses.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        courses: allCourses,
        total: allCourses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses - ADMIN ONLY.
 * On this closed platform the administrator creates the course and assigns
 * the teacher who will run it.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
      title,
      description,
      subjectId,
      grade,
      teacherId,
      price,
      isFree,
    } = body;

    // Validation
    if (!title || !subjectId || !grade || !teacherId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const [newCourse] = await db
      .insert(courses)
      .values({
        title,
        slug: `${slug}-${Date.now()}`,
        description,
        subjectId,
        grade: grade as any,
        teacherId,
        price: price ? price.toString() : "0",
        isFree: isFree ?? true,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Course created successfully",
        course: newCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
