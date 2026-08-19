import Link from "next/link";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import DangerZone from "@/components/admin/DangerZone";
import {
  auditLogs,
  courses,
  lessons,
  pdfs,
  questions,
  students,
  subjects,
  teachers,
  users,
  videos,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Count all rows in a table. */
async function count(table: PgTable): Promise<number> {
  const rows = await db.select({ n: sql<number>`count(*)::int` }).from(table);
  return rows[0]?.n ?? 0;
}

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();

  const [
    studentCount,
    teacherCount,
    subjectCount,
    courseCount,
    lessonCount,
    videoCount,
    pdfCount,
    questionCount,
  ] = await Promise.all([
    count(students),
    count(teachers),
    count(subjects),
    count(courses),
    count(lessons),
    count(videos),
    count(pdfs),
    count(questions),
  ]);

  const recent = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      createdAt: auditLogs.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(auditLogs)
    .leftJoin(users, sql`${users.id} = ${auditLogs.actorId}`)
    .orderBy(sql`${auditLogs.createdAt} desc`)
    .limit(8);

  const stats = [
    { label: "Students", value: studentCount, icon: "👨‍🎓", href: "/admin/students" },
    { label: "Teachers", value: teacherCount, icon: "👨‍🏫", href: "/admin/teachers" },
    { label: "Subjects", value: subjectCount, icon: "📋", href: "/admin/subjects" },
    { label: "Courses", value: courseCount, icon: "📚", href: "/admin/courses" },
    { label: "Lessons", value: lessonCount, icon: "🗂️", href: "/admin/curriculum" },
    { label: "Videos", value: videoCount, icon: "🎬", href: "/admin/content" },
    { label: "PDFs", value: pdfCount, icon: "📄", href: "/admin/content" },
    { label: "Questions", value: questionCount, icon: "❓", href: "/admin/questions" },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Welcome back, {user?.firstName}
      </h1>
      <p className="text-slate-600 mt-2 mb-10 leading-relaxed max-w-2xl">
        Your command centre for HarmeLearn — manage accounts, curriculum and
        learning content for every grade.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-slate-200 rounded-xl p-7 hover:shadow-md hover:border-blue-300 transition"
          >
            <p className="text-3xl mb-3">{s.icon}</p>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-600 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-white border border-slate-200 rounded-xl p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            Set-up checklist
          </h2>
          <ol className="space-y-3 text-sm">
            {[
              { done: subjectCount > 0, text: "Create your subjects", href: "/admin/subjects" },
              { done: teacherCount > 0, text: "Register your teachers", href: "/admin/teachers" },
              { done: courseCount > 0, text: "Create courses and units", href: "/admin/curriculum" },
              { done: lessonCount > 0, text: "Add lessons", href: "/admin/curriculum" },
              { done: videoCount + pdfCount > 0, text: "Upload videos and PDFs", href: "/admin/content" },
              { done: questionCount > 0, text: "Build the question bank", href: "/admin/questions" },
              { done: studentCount > 0, text: "Enrol your students", href: "/admin/students" },
            ].map((step) => (
              <li key={step.text} className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step.done
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step.done ? "✓" : ""}
                </span>
                <Link
                  href={step.href}
                  className={`hover:underline ${
                    step.done ? "text-slate-500 line-through" : "text-slate-800 font-medium"
                  }`}
                >
                  {step.text}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent admin activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <span className="text-slate-700">
                    <strong className="font-medium">
                      {r.firstName ? `${r.firstName} ${r.lastName}` : "System"}
                    </strong>{" "}
                    · {r.action.replace(".", " ")}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8">
        <DangerZone />
      </div>
    </div>
  );
}
