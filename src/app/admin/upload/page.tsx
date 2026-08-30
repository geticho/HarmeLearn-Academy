"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useCatalog, lessonPath } from "@/components/admin/useCatalog";

type Tab = "video" | "pdf" | "quiz" | "pastExam";

interface PendingQuestion {
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function AdminUploadPage() {
  const { catalog, loading: catalogLoading, reload } = useCatalog();
  const [tab, setTab] = useState<Tab>("video");
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
const [csvResult, setCsvResult] = useState<{ message: string; errors: { row: number; error: string }[] } | null>(null);
const [uploadingQuizCsv, setUploadingQuizCsv] = useState(false);
const [quizCsvResult, setQuizCsvResult] = useState<{ message: string; errors: { row: number; error: string }[] } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ----- Cascade state: subject → grade → course → unit → lesson -----
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("9");
  const [courseId, setCourseId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [lessonId, setLessonId] = useState("");

  // ----- Forms -----
  const [videoForm, setVideoForm] = useState({ title: "", videoUrl: "", duration: "", description: "" });
  const [pdfForm, setPdfForm] = useState({ title: "", fileUrl: "", pages: "", description: "" });
  const [quizForm, setQuizForm] = useState({ title: "", passingScore: "60", timeLimit: "" });
  const [examForm, setExamForm] = useState({ title: "", year: "", fileUrl: "", description: "" });

  // ----- Question builders -----
  const [quizId, setQuizId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<PendingQuestion[]>([]);
  const [pastExamId, setPastExamId] = useState("");
  const [examQuestions, setExamQuestions] = useState<PendingQuestion[]>([]);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qAnswer, setQAnswer] = useState("");
  const [qExplanation, setQExplanation] = useState("");

  // Filtered lists from catalog.
  const subjects = catalog.subjects;
  const courses = catalog.courses.filter(
    (c) => (!subjectId || c.subjectId === subjectId) && (!grade || c.grade === grade)
  );
  const units = catalog.units.filter((u) => u.courseId === courseId);
  const lessons = catalog.lessons.filter((l) => l.unitId === unitId);

  // Auto-pick the first available subject once catalog loads.
  useEffect(() => {
    if (!subjectId && subjects.length > 0) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  // When subject/grade changes, auto-pick the first matching course.
  useEffect(() => {
    if (courses.length === 0) {
      if (courseId) setCourseId("");
      return;
    }
    if (!courseId || !courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  // When course changes, auto-pick the first unit under it.
  useEffect(() => {
    if (units.length === 0) {
      if (unitId) setUnitId("");
      return;
    }
    if (!unitId || !units.some((u) => u.id === unitId)) {
      setUnitId(units[0].id);
    }
  }, [units, unitId]);

  // When unit changes, auto-pick the first lesson under it.
  useEffect(() => {
    if (lessons.length === 0) {
      if (lessonId) setLessonId("");
      return;
    }
    if (!lessonId || !lessons.some((l) => l.id === lessonId)) {
      setLessonId(lessons[0].id);
    }
  }, [lessons, lessonId]);

  const resetCascade = () => {
    setCourseId("");
    setUnitId("");
    setLessonId("");
  };

  async function quickCreateUnit() {
    if (!courseId) {
      setError("Pick a course first, then create a chapter.");
      return;
    }
    const title = window.prompt("Chapter (unit) title", "Unit 1: Foundations");
    if (!title?.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "unit", courseId, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create chapter");
        return;
      }
      setMessage(`Chapter created: ${data.unit.title}`);
      await reload();
      setUnitId(data.unit.id);
      setLessonId("");
    } finally {
      setSaving(false);
    }
  }
  async function handleCsvUpload(file: File) {
  if (!pastExamId) return;
  setUploadingCsv(true);
  setCsvResult(null);
  setError("");
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pastExamId", pastExamId);
    const res = await fetch("/api/admin/past-exams/questions/bulk", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Bulk upload failed");
    setCsvResult({ message: data.message, errors: data.errors || [] });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Bulk upload failed");
  } finally {
    setUploadingCsv(false);
  }
}
async function handleQuizCsvUpload(file: File) {
  if (!quizId) return;
  setUploadingQuizCsv(true);
  setQuizCsvResult(null);
  setError("");
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quizId", quizId);
    const res = await fetch("/api/admin/questions/bulk", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Bulk upload failed");
    setQuizCsvResult({ message: data.message, errors: data.errors || [] });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Bulk upload failed");
  } finally {
    setUploadingQuizCsv(false);
  }
}

  async function quickCreateLesson() {
    if (!unitId) {
      setError("Pick a chapter first, then create a lesson.");
      return;
    }
    const title = window.prompt("Lesson title", "Lesson 1: Introduction");
    if (!title?.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lesson", unitId, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create lesson");
        return;
      }
      setMessage(`Lesson created: ${data.lesson.title}`);
      await reload();
      setLessonId(data.lesson.id);
    } finally {
      setSaving(false);
    }
  }

  const loadQuizQuestions = useCallback(
    async (qid: string) => {
      if (!qid) return;
      const res = await fetch(`/api/admin/questions?quizId=${qid}`);
      const data = await res.json();
      // We show questions inline from the quiz; reuse state for display list.
      setQuizQuestions(
        (data.questions ?? []).map((q: { questionText: string; questionType: string; options: unknown; correctAnswer: string; explanation: string | null }) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? "",
        }))
      );
    },
    []
  );

  async function submitQuestion(target: "quiz" | "exam") {
    const targetId = target === "quiz" ? quizId : pastExamId;
    if (!targetId) {
      setError(target === "quiz" ? "Create the quiz first, then add questions." : "Create the past exam first, then add questions.");
      return;
    }
    if (!qText.trim() || !qAnswer.trim()) {
      setError("Question text and correct answer are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(
        target === "quiz" ? "/api/admin/questions" : "/api/admin/past-exams/questions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: target === "quiz" ? targetId : undefined,
            pastExamId: target === "exam" ? targetId : undefined,
            questionText: qText,
            questionType: qType,
            options: qType === "multiple_choice" ? qOptions.filter((o) => o.trim()) : undefined,
            correctAnswer: qAnswer,
            explanation: qExplanation || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add question");
      setMessage("Question added ✓ (correct answer, wrong answers and explanation saved)");
      setQText("");
      setQAnswer("");
      setQExplanation("");
      setQOptions(["", "", "", ""]);
      if (target === "quiz") {
        loadQuizQuestions(targetId);
        reload();
      }
    } finally {
      setSaving(false);
    }
  }

  // ----- Submits -----
  async function submitVideo(e: FormEvent) {
    e.preventDefault();
    if (!lessonId) return setError("Pick a chapter/lesson first (cascade above).");
    setError(""); setMessage(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, ...videoForm }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add video");
      setMessage(`Video added to ${lessonPath(catalog, lessonId)} ✓`);
      setVideoForm({ title: "", videoUrl: "", duration: "", description: "" });
    } finally {
      setSaving(false);
    }
  }
async function handlePdfFileUpload(file: File) {
  setError("");
  setUploadingPdf(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload-file", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    setPdfForm((prev) => ({ ...prev, fileUrl: data.url }));
  } catch (err) {
    setError(err instanceof Error ? err.message : "Upload failed");
  } finally {
    setUploadingPdf(false);
  }
}
  async function submitPdf(e: FormEvent) {
    e.preventDefault();
    if (!lessonId) return setError("Pick a chapter/lesson first (cascade above).");
    setError(""); setMessage(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, ...pdfForm }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add PDF");
      setMessage(`PDF added to ${lessonPath(catalog, lessonId)} ✓`);
      setPdfForm({ title: "", fileUrl: "", pages: "", description: "" });
    } finally {
      setSaving(false);
    }
  }

  async function submitQuiz(e: FormEvent) {
    e.preventDefault();
    if (!lessonId) return setError("Pick a chapter/lesson first (cascade above).");
    setError(""); setMessage(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quiz", lessonId, ...quizForm }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not create quiz");
      setQuizId(data.quiz.id);
      setMessage(`Quiz "${data.quiz.title}" created — now add questions below with correct/wrong answers + explanations.`);
      setQuizForm({ title: "", passingScore: "60", timeLimit: "" });
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function submitPastExam(e: FormEvent) {
    e.preventDefault();
    if (!subjectId || !grade) return setError("Pick a subject and grade first.");
    setError(""); setMessage(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/past-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          grade,
          unitId: unitId || undefined,
          ...examForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not create past exam");
      setPastExamId(data.exam.id);
      setMessage(`Past exam "${data.exam.title}" created — now add questions below.`);
      setExamForm({ title: "", year: "", fileUrl: "", description: "" });
      reload();
    } finally {
      setSaving(false);
    }
  }

  const qOptionsChanged = (i: number, v: string) => {
    const next = [...qOptions];
    next[i] = v;
    setQOptions(next);
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Upload Center</h1>
      <p className="text-slate-600 mt-2 mb-8 max-w-3xl leading-relaxed">
        Upload <strong>chapter by chapter</strong>: pick the subject, grade and
        chapter (lesson) once — then attach videos, PDFs, quizzes and past exams
        to that chapter. Quizzes and past exams support online taking with
        <strong> correct answers, wrong answers and explanations</strong>.
      </p>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">{message}</div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
      )}

      {/* Content type tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {([
          ["video", "🎬 Video"],
          ["pdf", "📄 PDF"],
          ["quiz", "🧠 Quiz"],
          ["pastExam", "📋 Past Exam"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chapter cascade */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Choose chapter path</h2>
          <button
            type="button"
            onClick={() => reload()}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            {catalogLoading ? "Loading…" : "↻ Refresh list"}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <F label="1. Subject *">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                resetCascade();
              }}
              className="input"
            >
              <option value="">Select…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </F>
          <F label="2. Grade *">
            <select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                resetCascade();
              }}
              className="input"
            >
              {["9", "10", "11", "12"].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </F>
          <F label="3. Course">
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setUnitId("");
                setLessonId("");
              }}
              className="input"
            >
              <option value="">
                {courses.length === 0 ? "No course for this grade" : "Select…"}
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </F>
          <F label="4. Chapter (Unit)">
            <select
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                setLessonId("");
              }}
              className="input"
              disabled={!courseId}
            >
              <option value="">
                {!courseId
                  ? "Pick a course first"
                  : units.length === 0
                    ? "No chapters yet"
                    : "Select…"}
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.title}</option>
              ))}
            </select>
          </F>
          <F label="5. Lesson">
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="input"
              disabled={!unitId}
            >
              <option value="">
                {!unitId
                  ? "Pick a chapter first"
                  : lessons.length === 0
                    ? "No lessons yet"
                    : "Select…"}
              </option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </F>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
          {catalogLoading ? (
            <p>Loading subjects, courses, units and lessons…</p>
          ) : subjects.length === 0 ? (
            <p>
              No subjects found. Create subjects first in <strong>Subjects</strong>, then courses/units/lessons in <strong>Curriculum</strong>.
            </p>
          ) : courses.length === 0 ? (
            <p>
              No course for this subject/grade. Create one in <strong>Curriculum → Course</strong>.
            </p>
          ) : units.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p>This course has no chapters yet.</p>
              <button
                type="button"
                onClick={quickCreateUnit}
                disabled={saving}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                + Create chapter now
              </button>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p>This chapter has no lessons yet.</p>
              <button
                type="button"
                onClick={quickCreateLesson}
                disabled={saving}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                + Create lesson now
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Selected path: <strong>{lessonPath(catalog, lessonId)}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={quickCreateUnit}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-white disabled:opacity-50"
                >
                  + Chapter
                </button>
                <button
                  type="button"
                  onClick={quickCreateLesson}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-white disabled:opacity-50"
                >
                  + Lesson
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {tab === "video" && (
        <form onSubmit={submitVideo} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid sm:grid-cols-2 gap-5 max-w-3xl">
          <F label="Video title *">
            <input required value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} className="input" />
          </F>
          <F label="Duration (seconds)">
            <input type="number" min="1" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })} className="input" />
          </F>
          <F label="Video URL *" full>
            <input required type="url" value={videoForm.videoUrl} onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })} className="input" placeholder="https://…" />
          </F>
          <F label="Description" full>
            <textarea rows={2} value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} className="input" />
          </F>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Upload video to this chapter"}
            </button>
          </div>
        </form>
      )}

      {tab === "pdf" && (
        <form onSubmit={submitPdf} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid sm:grid-cols-2 gap-5 max-w-3xl">
          <F label="Document title *">
            <input required value={pdfForm.title} onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })} className="input" />
          </F>
          <F label="Pages">
            <input type="number" min="1" value={pdfForm.pages} onChange={(e) => setPdfForm({ ...pdfForm, pages: e.target.value })} className="input" />
          </F>
        <F label="Upload from your computer" full>
            <input
              type="file"
              accept="application/pdf"
              disabled={uploadingPdf}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfFileUpload(file);
              }}
              className="input"
            />
            {uploadingPdf && <p className="text-sm text-blue-600 mt-1">Uploading…</p>}
          </F>
          <F label="File URL *" full>
            <input required type="url" value={pdfForm.fileUrl} onChange={(e) => setPdfForm({ ...pdfForm, fileUrl: e.target.value })} className="input" placeholder="https://… (auto-filled after upload)" />
          </F>
          <F label="Description" full>
            <textarea rows={2} value={pdfForm.description} onChange={(e) => setPdfForm({ ...pdfForm, description: e.target.value })} className="input" />
          </F>
          <div className="sm:col-span-2 flex justify-end">
            <button disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Upload PDF to this chapter"}
            </button>
          </div>
        </form>
      )}

      {tab === "quiz" && (
        <div className="space-y-8">
          <form onSubmit={submitQuiz} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid sm:grid-cols-3 gap-5 max-w-3xl">
            <F label="Quiz title *" full>
              <input required value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} className="input" placeholder="Chapter 1 check-up" />
            </F>
            <F label="Passing score (%)">
              <input type="number" min="1" max="100" value={quizForm.passingScore} onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })} className="input" />
            </F>
            <F label="Time limit (min)">
              <input type="number" min="1" value={quizForm.timeLimit} onChange={(e) => setQuizForm({ ...quizForm, timeLimit: e.target.value })} className="input" />
            </F>
            <div className="sm:col-span-3 flex justify-end">
              <button disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Creating…" : "1️⃣ Create quiz for this chapter"}
              </button>
            </div>
          </form>
          {quizId && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-3xl mb-6">
              <h3 className="font-bold text-slate-900 mb-2">Bulk upload questions from CSV</h3>
              <p className="text-sm text-slate-600 mb-4">
                Columns: questionText, questionType, option1, option2, option3, option4, correctAnswer, explanation
              </p>
              <input
                type="file"
                accept=".csv"
                disabled={uploadingQuizCsv}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQuizCsvUpload(file);
                }}
                className="input"
              />
              {uploadingQuizCsv && <p className="text-sm text-blue-600 mt-2">Uploading…</p>}
              {quizCsvResult && (
                <div className="mt-3 text-sm">
                  <p className="text-green-700 font-medium">{quizCsvResult.message}</p>
                  {quizCsvResult.errors.length > 0 && (
                    <ul className="text-red-600 mt-1 list-disc list-inside">
                      {quizCsvResult.errors.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {quizId && <QuestionBuilder
            targetLabel="quiz"
            qText={qText} setQText={setQText}
            qType={qType} setQType={setQType}
            qOptions={qOptions} qOptionsChanged={qOptionsChanged}
            qAnswer={qAnswer} setQAnswer={setQAnswer}
            qExplanation={qExplanation} setQExplanation={setQExplanation}
            onAdd={() => submitQuestion("quiz")}
            saving={saving}
            existing={quizQuestions}
          />}
        </div>
      )}

      {tab === "pastExam" && (
        <div className="space-y-8">
          <form onSubmit={submitPastExam} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid sm:grid-cols-2 gap-5 max-w-3xl">
            <F label="Exam title *">
              <input required value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} className="input" placeholder="National Exam — Chapter 3" />
            </F>
            <F label="Year">
              <input type="number" min="1990" max="2100" value={examForm.year} onChange={(e) => setExamForm({ ...examForm, year: e.target.value })} className="input" />
            </F>
            <F label="Paper PDF URL (optional)" full>
              <input type="url" value={examForm.fileUrl} onChange={(e) => setExamForm({ ...examForm, fileUrl: e.target.value })} className="input" placeholder="https://… (optional — students can also take it online)" />
            </F>
            <F label="Description" full>
              <textarea rows={2} value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} className="input" />
            </F>
            <div className="sm:col-span-2 flex justify-end">
              <button disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Creating…" : "1️⃣ Create past exam"}
              </button>
            </div>
          </form>
          {pastExamId && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-3xl mb-6">
              <h3 className="font-bold text-slate-900 mb-2">Bulk upload questions from CSV</h3>
              <p className="text-sm text-slate-600 mb-4">
                Columns: questionText, questionType, option1, option2, option3, option4, correctAnswer, explanation
              </p>
              <input
                type="file"
                accept=".csv"
                disabled={uploadingCsv}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvUpload(file);
                }}
                className="input"
              />
              {uploadingCsv && <p className="text-sm text-blue-600 mt-2">Uploading…</p>}
              {csvResult && (
                <div className="mt-3 text-sm">
                  <p className="text-green-700 font-medium">{csvResult.message}</p>
                  {csvResult.errors.length > 0 && (
                    <ul className="text-red-600 mt-1 list-disc list-inside">
                      {csvResult.errors.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {pastExamId && <QuestionBuilder
            targetLabel="past exam"
            qText={qText} setQText={setQText}
            qType={qType} setQType={setQType}
            qOptions={qOptions} qOptionsChanged={qOptionsChanged}
            qAnswer={qAnswer} setQAnswer={setQAnswer}
            qExplanation={qExplanation} setQExplanation={setQExplanation}
            onAdd={() => submitQuestion("exam")}
            saving={saving}
            existing={examQuestions}
          />}
        </div>
      )}
    </div>
  );
}

function QuestionBuilder({
  targetLabel,
  qText, setQText,
  qType, setQType,
  qOptions, qOptionsChanged,
  qAnswer, setQAnswer,
  qExplanation, setQExplanation,
  onAdd, saving, existing,
}: {
  targetLabel: string;
  qText: string; setQText: (v: string) => void;
  qType: string; setQType: (v: string) => void;
  qOptions: string[]; qOptionsChanged: (i: number, v: string) => void;
  qAnswer: string; setQAnswer: (v: string) => void;
  qExplanation: string; setQExplanation: (v: string) => void;
  onAdd: () => void; saving: boolean;
  existing: { questionText: string; correctAnswer: string; explanation: string }[];
}) {
  const [type, setType] = useState(qType);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-3xl">
      <h2 className="text-lg font-bold text-slate-900 mb-1">2️⃣ Add questions to this {targetLabel}</h2>
      <p className="text-sm text-slate-500 mb-5">
        Each question saves the <strong>correct answer</strong>, the <strong>wrong answers</strong> (options) and an <strong>explanation</strong> — students see all three after submitting.
      </p>

      <div className="grid gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Question type</span>
          <select
            value={qType}
            onChange={(e) => {
              setQType(e.target.value);
              setType(e.target.value);
              setQAnswer("");
            }}
            className="input"
          >
            <option value="multiple_choice">Multiple choice (correct + wrong options)</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short answer</option>
            <option value="essay">Essay (teacher-graded)</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Question *</span>
          <textarea rows={2} value={qText} onChange={(e) => setQText(e.target.value)} className="input" placeholder="What is the value of x in 2x + 4 = 10?" />
        </label>

        {qType === "multiple_choice" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {qOptions.map((opt, i) => (
              <label key={i} className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Option {String.fromCharCode(65 + i)} {i === 0 ? "(correct answer)" : "(wrong answer)"}
                </span>
                <input value={opt} onChange={(e) => qOptionsChanged(i, e.target.value)} className="input" />
              </label>
            ))}
          </div>
        )}

        {qType === "multiple_choice" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Correct answer * (must match one option exactly)</span>
            <select value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} className="input">
              <option value="">Select…</option>
              {qOptions.filter((o) => o.trim()).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        ) : qType === "true_false" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Correct answer *</span>
            <select value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} className="input">
              <option value="">Select…</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        ) : qType === "short_answer" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Model answer *</span>
            <input value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} className="input" />
          </label>
        ) : (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Marking guidance</span>
            <textarea rows={2} value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} className="input" />
          </label>
        )}

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Explanation * (shown to students after answering)</span>
          <textarea rows={2} value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} className="input" placeholder="2x = 6, so x = 3" />
        </label>

        <div className="flex justify-end">
          <button onClick={onAdd} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Saving…" : "+ Add question with answers & explanation"}
          </button>
        </div>
      </div>

      {existing.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Questions in this {targetLabel} ({existing.length})</h3>
          <div className="space-y-2">
            {existing.map((q, i) => (
              <div key={i} className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="font-medium text-slate-900">{i + 1}. {q.questionText}</p>
                <p className="text-green-700 mt-1">✓ Correct: {q.correctAnswer || "—"}</p>
                {q.explanation && <p className="text-slate-500">💡 {q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
