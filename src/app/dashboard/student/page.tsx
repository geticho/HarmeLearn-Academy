"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  downloadAssessmentForOffline,
  getAssessmentPack,
} from "@/lib/offline-assessments";

interface ContentItem {
  id: string;
  title: string;
  lessonTitle: string | null;
  videoUrl?: string;
  fileUrl?: string | null;
  content?: string;
  duration?: number | null;
  pages?: number | null;
  totalQuestions?: number | null;
  year?: number | null;
  description?: string | null;
}

interface SubjectCard {
  id: string;
  name: string;
  code: string;
  icon: string | null;
  color: string | null;
  courses: { id: string; title: string; enrolled: boolean }[];
  videos: ContentItem[];
  pdfs: ContentItem[];
  notes: ContentItem[];
  quizzes: ContentItem[];
  pastExams: ContentItem[];
}

interface DashboardData {
  student: { firstName: string; lastName: string };
  grade: string;
  stream: string | null;
  subjects: SubjectCard[];
  stats: {
    subjects: number;
    videos: number;
    pdfs: number;
    notes: number;
    quizzes: number;
    pastExams: number;
  };
}

type Tab = "videos" | "pdfs" | "notes" | "quizzes" | "pastExams";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "videos", label: "Videos", icon: "🎬" },
  { key: "pdfs", label: "PDFs", icon: "📄" },
  { key: "notes", label: "Short Notes", icon: "📝" },
  { key: "quizzes", label: "Quizzes", icon: "🧠" },
  { key: "pastExams", label: "Past Exams", icon: "📋" },
];

const TAB_COLORS: Record<Tab, string> = {
  videos: "from-blue-500 to-blue-600",
  pdfs: "from-red-500 to-red-600",
  notes: "from-amber-500 to-orange-600",
  quizzes: "from-purple-500 to-purple-600",
  pastExams: "from-emerald-500 to-green-600",
};

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<Record<string, Tab>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

 const load = useCallback(async () => {
    let meRes: Response;
    try {
      meRes = await fetch("/api/auth/me");
    } catch {
      // Genuinely offline with no cached response at all (service worker
      // itself unavailable, e.g. first-ever visit). Nothing we can show.
      return;
    }

    if (!meRes.ok) {
      // 401/403 from a live server means truly logged out — but a 503 means
      // the service worker had no cached "who am I" to fall back to while
      // offline. Only force a real login redirect when we're online and the
      // server genuinely rejected us.
      if (navigator.onLine && meRes.status !== 503) {
        router.push("/login");
      }
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/student/dashboard");
    } catch {
      return;
    }

    if (!res.ok) {
      if (navigator.onLine) {
        router.push("/not-authorized");
      }
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function enroll(courseId: string) {
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const body = await res.json();
    if (!res.ok) {
      alert(body.error || "Enrollment failed");
      return;
    }
    load(); // refresh enrolled state
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your learning space…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 overflow-y-auto hidden md:block`}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BrandLogo size={32} />
            {sidebarOpen && <span className="font-bold">HarmeLearn</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/70 hover:text-white p-1"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-1 text-sm">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard/student" },
            { icon: "📚", label: "My Courses", href: "/courses" },
            { icon: "📖", label: "Library", href: "#library" },
            { icon: "📅", label: "Schedule", href: "#schedule" },
            { icon: "⚙️", label: "Settings", href: "#settings" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 p-4 w-full border-t border-slate-800">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
            className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-slate-800 transition"
          >
            🚪 {sidebarOpen ? "Sign out" : ""}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 text-white px-6 sm:px-12 py-14">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div>
              <p className="text-white/80 text-sm mb-2">Welcome back,</p>
              <h1 className="text-3xl sm:text-4xl font-bold">
                {data.student.firstName} {data.student.lastName} 👋
              </h1>
              <p className="text-white/90 mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full px-5 py-2 text-sm font-medium">
                🎓 Grade {data.grade}
                {data.stream ? ` · ${data.stream === "natural" ? "Natural Science" : "Social Science"}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Subjects", value: data.stats.subjects },
                { label: "Videos", value: data.stats.videos },
                { label: "Exams", value: data.stats.pastExams },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/15 backdrop-blur rounded-2xl px-7 py-6 text-center"
                >
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/80 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Subjects */}
        <div className="p-6 sm:p-12 space-y-10">
          {data.subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-5xl mb-4">📭</p>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                No subjects for Grade {data.grade} yet
              </h2>
              <p className="text-slate-600 mb-6">
                Your administrator is still building this grade&apos;s curriculum.
                Check back soon!
              </p>
            </div>
          ) : (
            data.subjects.map((subject) => {
              const activeTab = openTabs[subject.id] ?? "videos";
              return (
                <section
                  key={subject.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Subject header */}
                  <div className="flex flex-wrap items-center justify-between gap-5 px-6 sm:px-10 py-7 border-b border-slate-100">
                    <div className="flex items-center gap-5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                        style={{
                          background:
                            subject.color ||
                            "linear-gradient(135deg,#3b82f6,#10b981)",
                        }}
                      >
                        {subject.icon || "📘"}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {subject.name}
                        </h2>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
                          {subject.code} · Grade {data.grade}
                        </p>
                      </div>
                    </div>

                    {/* Enroll status */}
                    <div className="flex items-center gap-3">
                      {subject.courses.some((c) => c.enrolled) ? (
                        <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-semibold">
                          ✓ Enrolled
                        </span>
                      ) : subject.courses[0] ? (
                        <button
                          onClick={() => enroll(subject.courses[0].id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition"
                        >
                          + Enroll in {subject.name}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Content tabs */}
                  <div className="px-6 sm:px-10 pt-5">
                    <div className="flex gap-3 overflow-x-auto pb-3">
                      {TABS.map((tab) => {
                        const count = subject[tab.key].length;
                        const active = activeTab === tab.key;
                        return (
                          <button
                            key={tab.key}
                            onClick={() =>
                              setOpenTabs((prev) => ({
                                ...prev,
                                [subject.id]: tab.key,
                              }))
                            }
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                              active
                                ? `bg-gradient-to-r ${TAB_COLORS[tab.key]} text-white shadow`
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {tab.icon} {tab.label}
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-xs ${
                                active
                                  ? "bg-white/25"
                                  : "bg-white text-slate-600"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="px-6 sm:px-10 py-8">
                    <TabContent
                      tab={activeTab}
                      items={subject[activeTab]}
                      color={TAB_COLORS[activeTab]}
                      onSavedOffline={() => {
                        /* force re-render badges */
                        setOpenTabs((prev) => ({ ...prev }));
                      }}
                    />
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function TabContent({
  tab,
  items,
  color,
  onSavedOffline,
}: {
  tab: Tab;
  items: ContentItem[];
  color: string;
  onSavedOffline?: () => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center">
        Nothing here yet — your administrator will add {tab.replace(/([A-Z])/g, " $1").toLowerCase()} soon.
      </p>
    );
  }

  // All five tabs render as one VERTICAL stack of full-width rows,
  // one item per line, so lists are easy to scan.
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isVideo = tab === "videos";
        const isPdf = tab === "pdfs";
        const isNote = tab === "notes";
        const isQuiz = tab === "quizzes";
        const isExam = tab === "pastExams";

        const href = isQuiz
          ? `/quiz/${item.id}`
          : isExam && item.totalQuestions && item.totalQuestions > 0
            ? `/exam/${item.id}`
            : isVideo
              ? item.videoUrl
              : isPdf || isExam
                ? item.fileUrl
                : undefined;

        const icon = isVideo ? "▶️" : isPdf ? "📄" : isNote ? "📝" : isQuiz ? "🧠" : "📋";
        const actionLabel = isVideo
          ? "Watch ↗"
          : isPdf
            ? "Open PDF ↗"
            : isExam
              ? item.totalQuestions && item.totalQuestions > 0
                ? "Take exam →"
                : "Open paper ↗"
              : isQuiz
                ? "Start quiz"
                : null;
        const canSaveOffline =
          (isQuiz || (isExam && !!item.totalQuestions && item.totalQuestions > 0));
        const alreadySaved = canSaveOffline
          ? !!getAssessmentPack(isQuiz ? "quiz" : "exam", item.id)
          : false;
        const meta = isVideo
          ? item.duration
            ? `⏱ ${Math.round(item.duration / 60)} min`
            : null
          : isPdf
            ? item.pages
              ? `${item.pages} pages`
              : null
            : isQuiz
              ? `${item.totalQuestions ?? 0} questions`
              : isExam && item.year
                ? `${item.year} paper`
                : null;

        const rowInner = (
          <>
            {/* Icon block */}
            <div
              className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl`}
            >
              {icon}
            </div>

            {/* Title + meta */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-sm leading-snug">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {item.lessonTitle || (isExam ? item.description ?? "" : "")}
              </p>
              {meta && (
                <p className="text-xs text-slate-400 mt-0.5">{meta}</p>
              )}
            </div>

            {/* Action */}
            <span className="shrink-0 flex items-center gap-2">
              {canSaveOffline && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await downloadAssessmentForOffline(
                        isQuiz ? "quiz" : "exam",
                        item.id
                      );
                      onSavedOffline?.();
                      alert("Saved for offline use on this device.");
                    } catch (err) {
                      alert(
                        err instanceof Error
                          ? err.message
                          : "Could not save offline"
                      );
                    }
                  }}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10"
                >
                  {alreadySaved ? "Saved ✓" : "Save offline"}
                </button>
              )}
              {actionLabel && (
                <span
                  className={`text-sm font-semibold ${
                    isQuiz || (isExam && item.totalQuestions && item.totalQuestions > 0)
                      ? `px-4 py-2 bg-gradient-to-r ${color} text-white rounded-lg`
                      : "text-blue-600"
                  }`}
                >
                  {actionLabel}
                </span>
              )}
            </span>
          </>
        );

        // Notes expand in place; everything else is a link.
        if (isNote) {
          return (
            <details
              key={item.id}
              className="border border-slate-200 rounded-xl overflow-hidden group bg-white"
            >
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition">
                <div
                  className={`w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl`}
                >
                  📝
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-sm leading-snug">
                    {item.title}
                  </p>
                  {item.lessonTitle && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {item.lessonTitle}
                    </p>
                  )}
                </div>
                <span className="text-slate-400 group-open:rotate-180 transition shrink-0">
                  ▾
                </span>
              </summary>
              <div className="px-5 py-5 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border-t border-slate-100 bg-slate-50/50">
                {item.content}
              </div>
            </details>
          );
        }

        const rowClasses =
          "flex items-center gap-4 px-5 py-4 border border-slate-200 rounded-xl bg-white hover:shadow-md hover:border-blue-300 transition";

        return href ? (
          <a
            key={item.id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={rowClasses}
          >
            {rowInner}
          </a>
        ) : (
          <button key={item.id} className={`${rowClasses} w-full text-left`}>
            {rowInner}
          </button>
        );
      })}
    </div>
  );
}
