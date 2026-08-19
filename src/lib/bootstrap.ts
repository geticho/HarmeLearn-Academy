import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

export const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() || "admin@harmelearn.et";
export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "Admin@12345";

let alreadyChecked = false;

/**
 * Make sure at least one Super Admin can sign in.
 *
 * - If a super_admin already exists, do nothing.
 * - Otherwise create (or upgrade) the default admin account.
 *
 * Safe to call repeatedly; the work happens at most once per process.
 */
export async function ensureSuperAdmin(): Promise<void> {
  if (alreadyChecked) return;
  alreadyChecked = true;

  // Does the schema exist yet? On a brand new container the tables may not
  // have been pushed at the moment the server boots.
  const tableReady = await db
    .execute(sql`select to_regclass('public.users') as t`)
    .then((res) => {
      const row = (res as unknown as { rows?: Array<{ t: string | null }> }).rows?.[0];
      return Boolean(row?.t);
    })
    .catch(() => false);

  if (!tableReady) {
    alreadyChecked = false; // Allow a retry on the next request.
    console.warn("[bootstrap] users table not ready yet, skipping admin check");
    return;
  }

  const existingAdmins = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "super_admin"));

  if ((existingAdmins[0]?.n ?? 0) > 0) return;

  const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);

  // The email may already be taken by a non-admin row; upgrade it if so.
  const sameEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEFAULT_ADMIN_EMAIL))
    .limit(1);

  if (sameEmail.length > 0) {
    await db
      .update(users)
      .set({
        role: "super_admin",
        passwordHash,
        isActive: true,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sameEmail[0].id));
    console.log(`[bootstrap] Upgraded ${DEFAULT_ADMIN_EMAIL} to Super Admin`);
    return;
  }

  await db.insert(users).values({
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash,
    firstName: "Platform",
    lastName: "Administrator",
    role: "super_admin",
    isActive: true,
    emailVerified: true,
  });

  console.log(`[bootstrap] Created Super Admin ${DEFAULT_ADMIN_EMAIL}`);
}
