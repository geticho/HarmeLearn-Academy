import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, sessions, users } from "@/db/schema";
import { generateSessionToken } from "@/lib/auth";

export const SESSION_COOKIE = "harmelearn_session";
export const SESSION_TTL_DAYS = 30;

export type Role =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar: string | null;
  isActive: boolean;
}

/** Roles allowed to manage platform data (create users, subjects, content). */
export const ADMIN_ROLES: Role[] = ["super_admin", "school_admin"];

/**
 * Create a session row and return the opaque token to store in a cookie.
 */
export async function createSession(
  userId: string,
  userAgent?: string | null
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    token,
    userAgent: userAgent ?? null,
    expiresAt,
  });

  return { token, expiresAt };
}

/** Delete a session (logout). */
export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Resolve the currently signed-in user from the session cookie.
 * Returns null when there is no valid, unexpired session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      avatar: users.avatar,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0];
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as Role,
    avatar: user.avatar,
    isActive: Boolean(user.isActive),
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Guard for API routes. Throws AuthError when the caller is not signed in
 * or does not hold one of the allowed roles.
 */
export async function requireRole(allowed: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("You must be signed in.", 401);
  }
  if (!allowed.includes(user.role)) {
    throw new AuthError("You do not have permission to do this.", 403);
  }
  return user;
}

/** Shortcut: only Super Admin / School Admin may pass. */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(ADMIN_ROLES);
}

/** Convert an AuthError (or unknown error) into a JSON Response. */
export function authErrorResponse(error: unknown): Response | null {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}

/** Record a privileged action for accountability. */
export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: unknown;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      details: (params.details ?? null) as never,
    });
  } catch (error) {
    // Auditing must never break the request.
    console.error("Audit log failed:", error);
  }
}
