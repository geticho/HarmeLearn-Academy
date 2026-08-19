"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

interface ResultItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}

type Grouped = Record<string, ResultItem[]>;

const GROUP_LABELS: Record<string, string> = {
  subject: "Subjects",
  course: "Courses",
  video: "Videos",
  pdf: "PDFs",
  note: "Short notes",
  quiz: "Quizzes",
  "past exam": "Past exams",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Grouped | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.results ?? {});
      setTotal(data.total ?? 0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const order = [
    "subject",
    "course",
    "video",
    "pdf",
    "note",
    "quiz",
    "past exam",
  ].filter((k) => results && results[k]?.length);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={44} />
            <span className="font-bold text-xl">HarmeLearn</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-slate-700 hover:text-blue-600">Home</Link>
            <Link href="/courses" className="text-slate-700 hover:text-blue-600">Courses</Link>
            <Link href="/search" className="text-blue-600 font-semibold">Search</Link>
            <Link href="/login" className="text-slate-700 hover:text-blue-600">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero + search box */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-6 sm:px-8">
          <h1 className="text-4xl font-bold mb-3">Search HarmeLearn</h1>
          <p className="text-white/90 mb-8">
            Find courses, videos, PDFs, notes, quizzes and past exams across all
            subjects and grades.
          </p>
          <div className="max-w-2xl">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
                🔍
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “Mathematics”, “Grade 12”, “past exam”, “photosynthesis”…"
                className="w-full pl-14 pr-6 py-4 rounded-2xl border-0 text-slate-900 text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-6 sm:px-8 py-12">
        {loading ? (
          <p className="text-slate-500 text-center py-10">Searching…</p>
        ) : !searched ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">💡</p>
            <p className="text-slate-600">
              Type something above — for example a subject like{" "}
              <button
                onClick={() => setQuery("Mathematics")}
                className="text-blue-600 font-semibold hover:underline"
              >
                Mathematics
              </button>{" "}
              or a keyword like{" "}
              <button
                onClick={() => setQuery("past exam")}
                className="text-blue-600 font-semibold hover:underline"
              >
                past exam
              </button>
            </p>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">🔎</p>
            <p className="text-slate-600">
              No results for “{query}”. Try a different word.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500 mb-8">
              {total} result{total === 1 ? "" : "s"} for “{query}”
            </p>
            <div className="space-y-10">
              {order.map((group) => (
                <section key={group}>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    {GROUP_LABELS[group] ?? group}{" "}
                    <span className="text-slate-400 text-sm font-medium">
                      ({results![group].length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {results![group].map((item) => (
                      <a
                        key={`${group}-${item.id}`}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          item.href.startsWith("http") ? "noreferrer" : undefined
                        }
                        className="flex items-center gap-4 px-5 py-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-300 transition"
                      >
                        <span className="text-2xl w-10 text-center shrink-0">
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900 text-sm leading-snug">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block text-xs text-slate-500 mt-1 truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                        <span className="ml-auto shrink-0 text-blue-600 text-sm font-semibold">
                          Open →
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
