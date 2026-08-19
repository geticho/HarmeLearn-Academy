import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, subjects, teachers, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      grade: courses.grade,
      isPublished: courses.isPublished,
      totalLessons: courses.totalLessons,
      totalStudents: courses.totalStudents,
      subjectName: subjects.name,
      teacherFirst: users.firstName,
      teacherLast: users.lastName,
    })
    .from(courses)
    .leftJoin(subjects, eq(subjects.id, courses.subjectId))
    .leftJoin(teachers, eq(teachers.id, courses.teacherId))
    .leftJoin(users, eq(users.id, teachers.userId))
    .orderBy(desc(courses.createdAt))
    .limit(200);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-600 mt-2">
            Courses are created by an administrator and assigned to a teacher.
          </p>
        </div>
        <Link
          href="/admin/curriculum"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + New course
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left">
              <tr>
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Grade</th>
                <th className="px-6 py-4 font-semibold">Teacher</th>
                <th className="px-6 py-4 font-semibold">Lessons</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No courses yet. Create one from the Curriculum page.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-slate-900">{c.title}</td>
                    <td className="px-6 py-4 text-slate-600">{c.subjectName ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-600">Grade {c.grade}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {c.teacherFirst ? `${c.teacherFirst} ${c.teacherLast}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.totalLessons ?? 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          c.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
