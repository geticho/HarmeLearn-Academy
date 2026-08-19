/**
 * Runs once when the Next.js server boots.
 *
 * 1. Guarantees a Super Admin exists (closed platform = no lockouts).
 * 2. Seeds the demo curriculum when the database is empty — every subject
 *    × every grade with videos, PDFs, short notes, quizzes and past exams —
 *    so students always see content under each subject.
 *
 * Both steps are idempotent and non-destructive. Disable the demo seed with
 * SEED_DEMO=false.
 */
export async function register() {
  // Only run in the Node.js runtime, and not during the production build.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) return;

  try {
    const { ensureSuperAdmin } = await import("@/lib/bootstrap");
    await ensureSuperAdmin();

    if (process.env.SEED_DEMO !== "false") {
      const { seedDemoCodes, seedDemoContent } = await import("@/lib/seed");
      await seedDemoCodes();
      await seedDemoContent();
    }
  } catch (error) {
    // Never prevent the server from starting.
    console.error("[bootstrap] Startup step failed:", error);
  }
}
