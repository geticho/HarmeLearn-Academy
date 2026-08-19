import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students, teachers } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Returns the signed-in user resolved from the server-side session. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  // Attach role-specific profile fields (grade/stream for students,
  // verification status for teachers) — still read from the server.
  let profile: Record<string, unknown> = {};

  if (user.role === "student") {
    const rows = await db
      .select({ grade: students.grade, stream: students.stream })
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);
    if (rows[0]) profile = { grade: rows[0].grade, stream: rows[0].stream };
  } else if (user.role === "teacher") {
    const rows = await db
      .select({ verificationStatus: teachers.verificationStatus })
      .from(teachers)
      .where(eq(teachers.userId, user.id))
      .limit(1);
    if (rows[0]) profile = { verificationStatus: rows[0].verificationStatus };
  }

  return Response.json({ user: { ...user, ...profile } }, { status: 200 });
}
