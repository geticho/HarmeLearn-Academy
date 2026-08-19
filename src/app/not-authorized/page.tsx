import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center shadow-sm">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Administrator access only
        </h1>
        <p className="text-slate-600 mb-6">
          This area of HarmeLearn Academy is restricted. Students and teachers do
          not have permission to manage accounts or upload content.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Back to home
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Sign in as admin
          </Link>
        </div>
      </div>
    </div>
  );
}
