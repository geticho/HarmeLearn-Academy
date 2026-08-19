"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { lessonPath, useCatalog } from "@/components/admin/useCatalog";

interface VideoRow {
  id: string;
  title: string;
  videoUrl: string;
  duration: number | null;
  lessonId: string;
  lessonTitle: string | null;
}
interface PdfRow {
  id: string;
  title: string;
  fileUrl: string;
  pages: number | null;
  lessonId: string;
  lessonTitle: string | null;
}
interface NoteRow {
  id: string;
  title: string;
  content: string;
  lessonId: string;
  lessonTitle: string | null;
}

type Tab = "video" | "pdf" | "note";

export default function AdminContentPage() {
  const { catalog, loading: catalogLoading } = useCatalog();
  const [tab, setTab] = useState<Tab>("video");
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [pdfs, setPdfs] = useState<PdfRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [videoForm, setVideoForm] = useState({
    lessonId: "",
    title: "",
    videoUrl: "",
    duration: "",
    description: "",
  });
  const [pdfForm, setPdfForm] = useState({
    lessonId: "",
    title: "",
    fileUrl: "",
    pages: "",
    description: "",
  });
  const [noteForm, setNoteForm] = useState({
    lessonId: "",
    title: "",
    content: "",
  });

  const load = useCallback(async () => {
    const [v, p, n] = await Promise.all([
      fetch("/api/admin/videos").then((r) => (r.ok ? r.json() : { videos: [] })),
      fetch("/api/admin/pdfs").then((r) => (r.ok ? r.json() : { pdfs: [] })),
      fetch("/api/admin/notes").then((r) => (r.ok ? r.json() : { notes: [] })),
    ]);
    setVideos(v.videos ?? []);
    setPdfs(p.pdfs ?? []);
    setNotes(n.notes ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitVideo(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoForm),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add video");
      setMessage("Video added.");
      setVideoForm({ ...videoForm, title: "", videoUrl: "", duration: "", description: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function submitPdf(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfForm),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add PDF");
      setMessage("PDF added.");
      setPdfForm({ ...pdfForm, title: "", fileUrl: "", pages: "", description: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function submitNote(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add note");
      setMessage("Short note added.");
      setNoteForm({ ...noteForm, title: "", content: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(type: "video" | "pdf" | "note", id: string) {
    await fetch(`/api/admin/content/${type}/${id}`, { method: "DELETE" });
    load();
  }

  const noLessons = !catalogLoading && catalog.lessons.length === 0;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Videos · PDFs · Short Notes
      </h1>
      <p className="text-slate-600 mt-1 mb-6 max-w-2xl">
        Learning material is uploaded by administrators only. Paste the hosted URL
        and attach it to a lesson — students see everything grouped by subject on
        their dashboard.
      </p>

      {noLessons && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          You need at least one lesson before you can attach content. Go to{" "}
          <strong>Curriculum</strong> and create a course → unit → lesson first.
        </div>
      )}
      {message && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {([
          ["video", "🎬 Videos"],
          ["pdf", "📄 PDFs"],
          ["note", "📝 Short Notes"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "video" && (
        <>
          <form
            onSubmit={submitVideo}
            className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 gap-6 mb-10 max-w-3xl"
          >
            <F label="Lesson *" full>
              <select
                required
                value={videoForm.lessonId}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, lessonId: e.target.value })
                }
                className="input"
              >
                <option value="">Select lesson…</option>
                {catalog.lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {lessonPath(catalog, l.id)}
                  </option>
                ))}
              </select>
            </F>
            <F label="Video title *">
              <input
                required
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                className="input"
              />
            </F>
            <F label="Duration (seconds)">
              <input
                type="number"
                min="1"
                value={videoForm.duration}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, duration: e.target.value })
                }
                className="input"
              />
            </F>
            <F label="Video URL *" full>
              <input
                required
                type="url"
                value={videoForm.videoUrl}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, videoUrl: e.target.value })
                }
                className="input"
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </F>
            <F label="Description" full>
              <textarea
                rows={2}
                value={videoForm.description}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, description: e.target.value })
                }
                className="input"
              />
            </F>
            <div className="sm:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add video"}
              </button>
            </div>
          </form>

          <Table
            empty="No videos uploaded yet."
            head={["Title", "Lesson", "URL", ""]}
            rows={videos.map((v) => [
              v.title,
              v.lessonTitle ?? "—",
              <a
                key={v.id}
                href={v.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open
              </a>,
              <button
                key={`${v.id}-d`}
                onClick={() => remove("video", v.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>,
            ])}
          />
        </>
      )}

      {tab === "pdf" && (
        <>
          <form
            onSubmit={submitPdf}
            className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 gap-6 mb-10 max-w-3xl"
          >
            <F label="Lesson *" full>
              <select
                required
                value={pdfForm.lessonId}
                onChange={(e) => setPdfForm({ ...pdfForm, lessonId: e.target.value })}
                className="input"
              >
                <option value="">Select lesson…</option>
                {catalog.lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {lessonPath(catalog, l.id)}
                  </option>
                ))}
              </select>
            </F>
            <F label="Document title *">
              <input
                required
                value={pdfForm.title}
                onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })}
                className="input"
              />
            </F>
            <F label="Pages">
              <input
                type="number"
                min="1"
                value={pdfForm.pages}
                onChange={(e) => setPdfForm({ ...pdfForm, pages: e.target.value })}
                className="input"
              />
            </F>
            <F label="File URL *" full>
              <input
                required
                type="url"
                value={pdfForm.fileUrl}
                onChange={(e) => setPdfForm({ ...pdfForm, fileUrl: e.target.value })}
                className="input"
                placeholder="https://…/grade9-unit1.pdf"
              />
            </F>
            <F label="Description" full>
              <textarea
                rows={2}
                value={pdfForm.description}
                onChange={(e) =>
                  setPdfForm({ ...pdfForm, description: e.target.value })
                }
                className="input"
              />
            </F>
            <div className="sm:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add PDF"}
              </button>
            </div>
          </form>

          <Table
            empty="No PDFs uploaded yet."
            head={["Title", "Lesson", "File", ""]}
            rows={pdfs.map((p) => [
              p.title,
              p.lessonTitle ?? "—",
              <a
                key={p.id}
                href={p.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Open
              </a>,
              <button
                key={`${p.id}-d`}
                onClick={() => remove("pdf", p.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>,
            ])}
          />
        </>
      )}

      {tab === "note" && (
        <>
          <form
            onSubmit={submitNote}
            className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 gap-6 mb-10 max-w-3xl"
          >
            <F label="Lesson *" full>
              <select
                required
                value={noteForm.lessonId}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, lessonId: e.target.value })
                }
                className="input"
              >
                <option value="">Select lesson…</option>
                {catalog.lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {lessonPath(catalog, l.id)}
                  </option>
                ))}
              </select>
            </F>
            <F label="Note title *" full>
              <input
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="input"
                placeholder="Key formulas — Unit 1"
              />
            </F>
            <F label="Note content *" full>
              <textarea
                required
                rows={6}
                value={noteForm.content}
                onChange={(e) =>
                  setNoteForm({ ...noteForm, content: e.target.value })
                }
                className="input font-mono text-sm"
                placeholder={"Quick revision points…\n• Point one\n• Point two"}
              />
            </F>
            <div className="sm:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add short note"}
              </button>
            </div>
          </form>

          <Table
            empty="No short notes yet."
            head={["Title", "Lesson", "Preview", ""]}
            rows={notes.map((n) => [
              n.title,
              n.lessonTitle ?? "—",
              <span key={n.id} className="text-slate-500 line-clamp-1">
                {n.content}
              </span>,
              <button
                key={`${n.id}-d`}
                onClick={() => remove("note", n.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>,
            ])}
          />
        </>
      )}
    </div>
  );
}

function F({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-left">
            <tr>
              {head.map((h, i) => (
                <th key={i} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={head.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((cells, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  {cells.map((c, j) => (
                    <td key={j} className="px-4 py-3 text-slate-700">
                      {c}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
