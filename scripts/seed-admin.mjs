/**
 * Creates (or resets) the first Super Admin account.
 *
 *   node scripts/seed-admin.mjs [email] [password]
 *
 * Defaults: admin@harmelearn.et / Admin@12345
 * Because self-registration is disabled, this is how the very first
 * administrator gets into the system. Every other account is then created
 * from the Admin Console.
 */
import crypto from "node:crypto";
import { Pool } from "pg";
import "dotenv/config";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const email = (process.argv[2] || "admin@harmelearn.et").toLowerCase();
const password = process.argv[3] || "Admin@12345";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const passwordHash = hashPassword(password);

  const existing = await pool.query("select id from users where email = $1", [
    email,
  ]);

  if (existing.rowCount > 0) {
    await pool.query(
      `update users
          set password_hash = $2,
              role = 'super_admin',
              is_active = true,
              email_verified = true,
              updated_at = now()
        where email = $1`,
      [email, passwordHash]
    );
    console.log(`✓ Super Admin password reset for ${email}`);
  } else {
    await pool.query(
      `insert into users
         (email, password_hash, first_name, last_name, role, is_active, email_verified)
       values ($1, $2, 'Platform', 'Administrator', 'super_admin', true, true)`,
      [email, passwordHash]
    );
    console.log(`✓ Super Admin created: ${email}`);
  }

  console.log(`  Password: ${password}`);
  console.log("  Sign in at /login then open /admin");
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
