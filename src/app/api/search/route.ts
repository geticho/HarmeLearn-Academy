import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessons,
  pastExams,
  pdfs,
  quizzes,
  shortNotes,
  subjects,
  units,
  videos,
} from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=mathematics
 * Public. Full-text-ish search across subjects, courses, videos, PDFs,
 * short notes, quizzes and past exams. Results are grouped by type so the
 * search page can render nice sections.
 */
export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ query: "", results: [] });
    }

    const term = `%${q}%`;
    const like = (col: unknown) => ilike(col as never, term);

    const [subjectRows, courseRows, videoRows, pdfRows, noteRows, quizRows, examRows] =
      await Promise.all([
        db
          .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            icon: subjects.icon,
            gradeFrom: subjects.gradeFrom,
            gradeTo: subjects.gradeTo,
          })
          .from(subjects)
          .where(or(like(subjects.name), like(subjects.code)))
          .limit(20),

        db
          .select({
            id: courses.id,
            title: courses.title,
            slug: courses.slug,
            description: courses.description,
            grade: courses.grade,
            isPublished: courses.isPublished,
          })
          .from(courses)
          .where(
            and(
              eq(courses.isPublished, true),
              or(like(courses.title), like(courses.description))
            )
          )
          .limit(20),

        db
          .select({
            id: videos.id,
            title: videos.title,
            videoUrl: videos.videoUrl,
            lessonTitle: lessons.title,
          })
          .from(videos)
          .innerJoin(lessons, eq(lessons.id, videos.lessonId))
          .where(like(videos.title))
          .limit(20),

        db
          .select({
            id: pdfs.id,
            title: pdfs.title,
            fileUrl: pdfs.fileUrl,
            lessonTitle: lessons.title,
          })
          .from(pdfs)
          .innerJoin(lessons, eq(lessons.id, pdfs.lessonId))
          .where(like(pdfs.title))
          .limit(20),

        db
          .select({
            id: shortNotes.id,
            title: shortNotes.title,
            content: shortNotes.content,
            lessonTitle: lessons.title,
          })
          .from(shortNotes)
          .innerJoin(lessons, eq(lessons.id, shortNotes.lessonId))
          .where(or(like(shortNotes.title), like(shortNotes.content)))
          .limit(20),

        db
          .select({
            id: quizzes.id,
            title: quizzes.title,
            totalQuestions: quizzes.totalQuestions,
            lessonTitle: lessons.title,
          })
          .from(quizzes)
          .innerJoin(lessons, eq(lessons.id, quizzes.lessonId))
          .where(like(quizzes.title))
          .limit(20),

        db
          .select({
            id: pastExams.id,
            title: pastExams.title,
            grade: pastExams.grade,
            year: pastExams.year,
            fileUrl: pastExams.fileUrl,
            totalQuestions: pastExams.totalQuestions,
          })
          .from(pastExams)
          .where(and(eq(pastExams.isPublished, true), like(pastExams.title)))
          .limit(20),
      ]);

    const results = [
      ...subjectRows.map((s) => ({
        type: "subject" as const,
        id: s.id,
        title: s.name,
        subtitle: `${s.code} · Grades ${s.gradeFrom}–${s.gradeTo}`,
        icon: s.icon || "📘",
        href: `/courses?grade=all&subject=${encodeURIComponent(s.name)}`,
      })),
      ...courseRows.map((c) => ({
        type: "course" as const,
        id: c.id,
        title: c.title,
        subtitle: c.description ?? `Grade ${c.grade}`,
        icon: "📚",
        href: `/course/${c.slug}`,
      })),
      ...videoRows.map((v) => ({
        type: "video" as const,
        id: v.id,
        title: v.title,
        subtitle: v.lessonTitle ?? "",
        icon: "🎬",
        href: v.videoUrl,
      })),
      ...pdfRows.map((p) => ({
        type: "pdf" as const,
        id: p.id,
        title: p.title,
        subtitle: p.lessonTitle ?? "",
        icon: "📄",
        href: p.fileUrl,
      })),
      ...noteRows.map((n) => ({
        type: "note" as const,
        id: n.id,
        title: n.title,
        subtitle: n.lessonTitle ?? "",
        icon: "📝",
        href: `/?note=${n.id}`,
      })),
      ...quizRows.map((qz) => ({
        type: "quiz" as const,
        id: qz.id,
        title: qz.title,
        subtitle: `${qz.lessonTitle ?? ""} · ${qz.totalQuestions ?? 0} questions`,
        icon: "🧠",
        href: `/quiz/${qz.id}`,
      })),
      ...examRows.map((e) => ({
        type: "past exam" as const,
        id: e.id,
        title: e.title,
        subtitle: `Grade ${e.grade}${e.year ? ` · ${e.year}` : ""}${
          e.totalQuestions && e.totalQuestions > 0
            ? ` · ${e.totalQuestions} questions (take online)`
            : ""
        }`,
        icon: "📋",
        href:
          e.totalQuestions && e.totalQuestions > 0
            ? `/exam/${e.id}`
            : e.fileUrl || "/search",
      })),
    ];

    const grouped = results.reduce<Record<string, typeof results>>(
      (acc, r) => {
        (acc[r.type] ||= []).push(r);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      query: q,
      total: results.length,
      results: grouped,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
