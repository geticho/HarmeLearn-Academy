"use client";

import { useCallback, useEffect, useState } from "react";

export interface CatalogSubject {
  id: string;
  name: string;
  code: string;
  gradeFrom: string;
  gradeTo: string;
}
export interface CatalogTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string | null;
}
export interface CatalogCourse {
  id: string;
  title: string;
  grade: string;
  subjectId: string;
  teacherId: string;
  isPublished: boolean | null;
}
export interface CatalogUnit {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}
export interface CatalogLesson {
  id: string;
  unitId: string;
  title: string;
  orderIndex: number;
}
export interface CatalogQuiz {
  id: string;
  lessonId: string;
  title: string;
  totalQuestions: number | null;
}

export interface Catalog {
  subjects: CatalogSubject[];
  teachers: CatalogTeacher[];
  courses: CatalogCourse[];
  units: CatalogUnit[];
  lessons: CatalogLesson[];
  quizzes: CatalogQuiz[];
}

const EMPTY: Catalog = {
  subjects: [],
  teachers: [],
  courses: [],
  units: [],
  lessons: [],
  quizzes: [],
};

/** Loads every dropdown source the admin forms need, in one request. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to load catalog");
        setCatalog(EMPTY);
        return;
      }
      setCatalog({
        subjects: data.subjects ?? [],
        teachers: data.teachers ?? [],
        courses: data.courses ?? [],
        units: data.units ?? [],
        lessons: data.lessons ?? [],
        quizzes: data.quizzes ?? [],
      });
    } catch {
      setError("Network error while loading catalog");
      setCatalog(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { catalog, loading, error, reload };
}

/** Human readable "Course › Unit › Lesson" label for a lesson id. */
export function lessonPath(catalog: Catalog, lessonId: string): string {
  const lesson = catalog.lessons.find((l) => l.id === lessonId);
  if (!lesson) return "—";
  const unit = catalog.units.find((u) => u.id === lesson.unitId);
  const course = unit ? catalog.courses.find((c) => c.id === unit.courseId) : null;
  return [course?.title, unit?.title, lesson.title].filter(Boolean).join(" › ");
}
