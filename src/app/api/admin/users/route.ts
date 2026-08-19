import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { students, teachers, users } from "@/db/schema";
import { hashPassword, isValidEmail, validatePasswordStrength } from "@/lib/auth";
import {
  authErrorResponse,
  logAudit,
  requireAdmin,
  type Role,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const CREATABLE_BY_SCHOOL_ADMIN: Role[] = ["student", "teacher", "parent"];
const CREATABLE_BY_SUPER_ADMIN: Role[] = [
  "student",
  "teacher",
  "parent",
  "school_admin",
  "super_admin",
];

/** Generate a readable temporary password, e.g. "Harme-4821-kt". */
function generateTempPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).slice(2, 4);
  return `Harme-${digits}-${suffix}`;
}

/**
 * GET /api/admin/users?role=student&search=abebe
 * Admin only. Lists platform accounts with their student/teacher profile.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = request.nextUrl.searchParams;
    const role = params.get("role");
    const search = params.get("search")?.trim();
    const limit = Math.min(parseInt(params.get("limit") || "100"), 200);

    const conditions: SQL[] = [];
    if (role && role !== "all") {
      conditions.push(eq(users.role, role as Role));
    }
    if (search) {
      const term = `%${search}%`;
      const match = or(
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term)
      );
      if (match) conditions.push(match);
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        grade: students.grade,
        stream: students.stream,
        enrollmentNumber: students.enrollmentNumber,
        specialization: teachers.specialization,
        employeeId: teachers.employeeId,
      })
      .from(users)
      .leftJoin(students, eq(students.userId, users.id))
      .leftJoin(teachers, eq(teachers.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    return NextResponse.json({ users: rows, total: rows.length });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("List users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Admin only. This is the ONLY way an account can be created on the platform.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const role = (body.role || "student") as Role;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name and email are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // A School Admin may not mint other administrators.
    const allowedRoles =
      admin.role === "super_admin"
        ? CREATABLE_BY_SUPER_ADMIN
        : CREATABLE_BY_SCHOOL_ADMIN;

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `You are not allowed to create a "${role}" account.` },
        { status: 403 }
      );
    }

    if (role === "student" && !body.grade) {
      return NextResponse.json(
        { error: "Grade is required for student accounts" },
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
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    // Admin may set a password, otherwise we generate a temporary one.
    const password = body.password ? String(body.password) : generateTempPassword();
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json(
        { error: "Weak password", details: strength.errors },
        { status: 400 }
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        phone,
        role,
        passwordHash: hashPassword(password),
        emailVerified: true, // Created by a trusted admin.
      })
      .returning();

    if (role === "student") {
      await db.insert(students).values({
        userId: newUser.id,
        grade: body.grade,
        stream: body.stream || null,
        schoolId: body.schoolId || null,
        enrollmentNumber: body.enrollmentNumber
          ? String(body.enrollmentNumber).trim()
          : null,
        parentEmail: body.parentEmail ? String(body.parentEmail).trim() : null,
      });
    } else if (role === "teacher") {
      await db.insert(teachers).values({
        userId: newUser.id,
        schoolId: body.schoolId || null,
        specialization: body.specialization || null,
        employeeId: body.employeeId ? String(body.employeeId).trim() : null,
        verificationStatus: "verified", // Vetted by the admin who created it.
      });
    }

    await logAudit({
      actorId: admin.id,
      action: "user.create",
      entityType: "user",
      entityId: newUser.id,
      details: { email, role },
    });

    return NextResponse.json(
      {
        message: `${role.replace("_", " ")} account created`,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
        // Shown once so the admin can hand it to the user.
        temporaryPassword: body.password ? undefined : password,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
