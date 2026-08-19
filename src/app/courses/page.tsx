"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

interface Course {
  id: string;
  title: string;
  description: string | null;
  grade: string;
  price: string;
  isFree: boolean | null;
  totalLessons: number | null;
  rating: string;
  totalStudents: number | null;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [me, setMe] = useState<{
    role: string;
    grade?: string;
  } | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (data.user) {
          setMe(data.user);
          // A student only ever sees their own grade.
          if (data.user.role === "student" && data.user.grade) {
            setSelectedGrade(data.user.grade);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGrade !== "all") params.append("grade", selectedGrade);
      params.append("limit", "100");

      const response = await fetch(`/api/courses?${params}`);
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function enroll(courseId: string) {
    setBusyId(courseId);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Enrollment failed");
      } else {
        setEnrolledIds((prev) => new Set(prev).add(courseId));
      }
    } finally {
      setBusyId(null);
    }
  }

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isStudent = me?.role === "student";

  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={44} />
            <span className="font-bold text-xl">HarmeLearn</span>
          </Link>
          <div className="hidden md:flex gap-10">
            <Link href="/" className="text-slate-700 hover:text-blue-600">Home</Link>
            <Link href="/courses" className="text-blue-600 font-semibold">Courses</Link>
            <Link href="/search" className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600">
              <span>🔍</span> Search
            </Link>
            {me ? (
              <Link
                href={
                  me.role === "student"
                    ? "/dashboard/student"
                    : me.role === "teacher"
                      ? "/dashboard/teacher"
                      : "/admin"
                }
                className="text-slate-700 hover:text-blue-600"
              >
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-slate-700 hover:text-blue-600">Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <h1 className="text-4xl font-bold mb-4">Explore Courses</h1>
          <p className="text-lg text-white/90">
            {isStudent
              ? `Showing Grade ${me.grade} courses — the only grade you can enroll in.`
              : "Find the perfect course for your academic journey"}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-6 sm:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search Courses
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course name..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Grade {isStudent && <span className="text-blue-600">(locked to your grade)</span>}
            </label>
            <select
              value={selectedGrade}
              disabled={isStudent}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="all">All Grades</option>
              {["9", "10", "11", "12"].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            {!me && (
              <Link
                href="/signup"
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
              >
                Sign up to enroll
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">
              {isStudent
                ? `No courses for Grade ${me.grade} yet — your administrator is building the curriculum.`
                : "No courses found. Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const enrolled = enrolledIds.has(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition hover:border-blue-300"
                >
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-5xl">
                    📚
                  </div>
                  <div className="p-7">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-slate-900 flex-1">
                        {course.title}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                        Grade {course.grade}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-5 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex justify-between items-center text-sm text-slate-600 mb-5">
                      <span>📖 {course.totalLessons ?? 0} Lessons</span>
                      <span>⭐ {parseFloat(course.rating || "0").toFixed(1)}</span>
                    </div>

                    <div className="flex justify-between items-center mb-5">
                      <span className="text-sm text-slate-600">
                        👥 {course.totalStudents ?? 0} students
                      </span>
                      {course.isFree ? (
                        <span className="text-green-600 font-bold">Free</span>
                      ) : (
                        <span className="font-bold text-slate-900">
                          Birr {course.price}
                        </span>
                      )}
                    </div>

                    {isStudent ? (
                      enrolled ? (
                        <button
                          disabled
                          className="w-full py-2 bg-green-100 text-green-700 rounded-lg font-semibold cursor-default"
                        >
                          ✓ Enrolled
                        </button>
                      ) : (
                        <button
                          onClick={() => enroll(course.id)}
                          disabled={busyId === course.id}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {busyId === course.id ? "Enrolling…" : "Enroll now"}
                        </button>
                      )
                    ) : (
                      <Link
                        href="/login"
                        className="block w-full py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
                      >
                        Sign in to enroll
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
