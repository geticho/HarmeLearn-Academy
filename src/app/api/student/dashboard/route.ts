import { NextResponse } from "next/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courseEnrollments,
  courses,
  lessons,
  pastExams,
  pdfs,
  quizzes,
  shortNotes,
  students,
  subjects,
  units,
  videos,
} from "@/db/schema";
import { authErrorResponse, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/dashboard
 * Student only. Returns the student's grade + stream and every subject that
 * covers that grade, each with its videos, PDFs, short notes, quizzes and
 * past exams, plus which courses the student is enrolled in.
 *
 * A student can only ever see content for their OWN grade — this endpoint
 * derives the grade from the session, never from the client.
 */
export async function GET() {
  try {
    const user = await requireRole(["student"]);

    const studentRows = await db
      .select()
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);

    if (studentRows.length === 0) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const student = studentRows[0];
    const grade = student.grade;

    // Subjects that cover this grade (gradeFrom <= grade <= gradeTo, numeric).
    const subjectRows = await db
      .select()
      .from(subjects)
      .where(
        and(
          sql`cast(${subjects.gradeFrom}::text as int) <= ${grade}::int`,
          sql`cast(${subjects.gradeTo}::text as int) >= ${grade}::int`
        )
      )
      .orderBy(asc(subjects.name));

    // Courses of this grade, grouped by subject.
    const courseRows = await db
      .select()
      .from(courses)
      .where(and(eq(courses.grade, grade), eq(courses.isPublished, true)))
      .orderBy(asc(courses.title));

    // The student's enrollments.
    const enrollmentRows = await db
      .select({ courseId: courseEnrollments.courseId })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.studentId, student.id));

    const enrolledCourseIds = new Set(
      enrollmentRows.map((e) => e.courseId)
    );

    // Gather all lessons under this grade's courses, and map each lesson to
    // its course so content can be bucketed per subject later.
    const courseIds = courseRows.map((c) => c.id);
    let lessonIds: string[] = [];
    const lessonToCourse = new Map<string, string>(); // lessonId -> courseId

    if (courseIds.length > 0) {
      const unitRows = await db
        .select({ id: units.id, courseId: units.courseId })
        .from(units)
        .where(inArray(units.courseId, courseIds));

      const unitIds = unitRows.map((u) => u.id);
      const unitToCourse = new Map(unitRows.map((u) => [u.id, u.courseId]));

      if (unitIds.length > 0) {
        const lessonRows = await db
          .select({ id: lessons.id, unitId: lessons.unitId })
          .from(lessons)
          .where(inArray(lessons.unitId, unitIds));
        lessonIds = lessonRows.map((l) => l.id);
        for (const l of lessonRows) {
          const courseId = unitToCourse.get(l.unitId);
          if (courseId) lessonToCourse.set(l.id, courseId);
        }
      }
    }

    // All content of this grade in one shot.
    const [videoRows, pdfRows, noteRows, quizRows] = lessonIds.length
      ? await Promise.all([
          db
            .select({
              id: videos.id,
              title: videos.title,
              videoUrl: videos.videoUrl,
              duration: videos.duration,
              lessonId: videos.lessonId,
              lessonTitle: lessons.title,
            })
            .from(videos)
            .innerJoin(lessons, eq(lessons.id, videos.lessonId))
            .where(inArray(videos.lessonId, lessonIds)),
          db
            .select({
              id: pdfs.id,
              title: pdfs.title,
              fileUrl: pdfs.fileUrl,
              pages: pdfs.pages,
              lessonId: pdfs.lessonId,
              lessonTitle: lessons.title,
            })
            .from(pdfs)
            .innerJoin(lessons, eq(lessons.id, pdfs.lessonId))
            .where(inArray(pdfs.lessonId, lessonIds)),
          db
            .select({
              id: shortNotes.id,
              title: shortNotes.title,
              content: shortNotes.content,
              lessonId: shortNotes.lessonId,
              lessonTitle: lessons.title,
            })
            .from(shortNotes)
            .innerJoin(lessons, eq(lessons.id, shortNotes.lessonId))
            .where(inArray(shortNotes.lessonId, lessonIds)),
          db
            .select({
              id: quizzes.id,
              title: quizzes.title,
              totalQuestions: quizzes.totalQuestions,
              lessonId: quizzes.lessonId,
              lessonTitle: lessons.title,
            })
            .from(quizzes)
            .innerJoin(lessons, eq(lessons.id, quizzes.lessonId))
            .where(inArray(quizzes.lessonId, lessonIds)),
        ])
      : [[], [], [], []];

    const pastExamRows = await db
      .select()
      .from(pastExams)
      .where(and(eq(pastExams.grade, grade), eq(pastExams.isPublished, true)))
      .orderBy(sql`${pastExams.year} desc nulls last`);

    // Assemble per-subject payloads.
    const subjectsPayload = subjectRows.map((subject) => {
      const subjectCourseIds = new Set(
        courseRows
          .filter((c) => c.subjectId === subject.id)
          .map((c) => c.id)
      );

      const inSubject = (lessonId: string) =>
        subjectCourseIds.has(lessonToCourse.get(lessonId) ?? "");

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        icon: subject.icon,
        color: subject.color,
        courses: courseRows
          .filter((c) => c.subjectId === subject.id)
          .map((c) => ({
            id: c.id,
            title: c.title,
            enrolled: enrolledCourseIds.has(c.id),
          })),
        videos: videoRows.filter((v) => inSubject(v.lessonId)),
        pdfs: pdfRows.filter((p) => inSubject(p.lessonId)),
        notes: noteRows.filter((n) => inSubject(n.lessonId)),
        quizzes: quizRows.filter((q) => inSubject(q.lessonId)),
        pastExams: pastExamRows.filter((e) => e.subjectId === subject.id),
      };
    });

    return NextResponse.json({
      student: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      grade,
      stream: student.stream,
      subjects: subjectsPayload,
      stats: {
        subjects: subjectsPayload.length,
        videos: videoRows.length,
        pdfs: pdfRows.length,
        notes: noteRows.length,
        quizzes: quizRows.length,
        pastExams: pastExamRows.length,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Student dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
