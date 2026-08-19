import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { registrationCodes, students, teachers, users } from "@/db/schema";
import { hashPassword, isValidEmail, validatePasswordStrength } from "@/lib/auth";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
} from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Public self-registration (Option A).
 *
 * Anyone may create a STUDENT or TEACHER account. They are signed in
 * immediately (session cookie is set by this response).
 *
 * NOT publicly creatable: super_admin / school_admin — those roles can only
 * be created by an existing administrator or by the bootstrap/seed script.
 * Subjects, courses, videos, PDFs and questions also remain admin-managed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const role = body.role === "teacher" ? "teacher" : "student";
    const grade = ["9", "10", "11", "12"].includes(body.grade) ? body.grade : "9";
    const stream =
      body.stream === "natural" || body.stream === "social" ? body.stream : null;
    const registrationCode = String(body.registrationCode || "")
      .trim()
      .toUpperCase();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email and password are required" },
        { status: 400 }
      );
    }

    // ---- Registration code (admin-issued invite) ----
    if (!registrationCode) {
      return NextResponse.json(
        {
          error:
            "A registration code is required. Ask your school administrator for the code.",
        },
        { status: 400 }
      );
    }

    const [code] = await db
      .select()
      .from(registrationCodes)
      .where(eq(registrationCodes.code, registrationCode))
      .limit(1);

    if (!code) {
      return NextResponse.json(
        { error: "Invalid registration code. Double-check it and try again." },
        { status: 400 }
      );
    }
    if (!code.isActive) {
      return NextResponse.json(
        { error: "This registration code has been deactivated by the administrator." },
        { status: 400 }
      );
    }
    if (code.expiresAt && code.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This registration code has expired. Ask for a new one." },
        { status: 400 }
      );
    }
    if (code.usedCount >= code.maxUses) {
      return NextResponse.json(
        { error: "This registration code has reached its usage limit." },
        { status: 400 }
      );
    }
    if (code.role !== role) {
      return NextResponse.json(
        {
          error: `This code is for ${code.role === "teacher" ? "teachers" : "students"} only.`,
        },
        { status: 400 }
      );
    }
    if (role === "student" && code.grade && code.grade !== grade) {
      return NextResponse.json(
        {
          error: `This code is only valid for Grade ${code.grade} students. You selected Grade ${grade}.`,
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json(
        { error: "Weak password", details: strength.errors },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        role,
        passwordHash: hashPassword(password),
        // No mail server is configured in this deployment, so accounts are
        // usable immediately. If you add SMTP, flip this to false and send a
        // verification link instead.
        emailVerified: true,
      })
      .returning();

    if (role === "student") {
      await db.insert(students).values({
        userId: newUser.id,
        grade: grade as "9" | "10" | "11" | "12",
        stream: stream as "natural" | "social" | null,
      });
    } else {
      await db.insert(teachers).values({
        userId: newUser.id,
        // New teachers start unverified until an administrator confirms them.
        verificationStatus: "pending",
      });
    }

    // Consume one use of the code (atomic).
    await db
      .update(registrationCodes)
      .set({ usedCount: sql`${registrationCodes.usedCount} + 1` })
      .where(
        and(
          eq(registrationCodes.id, code.id),
          sql`${registrationCodes.usedCount} < ${registrationCodes.maxUses}`
        )
      );

    // Sign the new user in right away.
    const { token } = await createSession(
      newUser.id,
      request.headers.get("user-agent")
    );

    const response = NextResponse.json(
      {
        message: "Account created — welcome to HarmeLearn!",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
