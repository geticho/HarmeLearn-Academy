import Link from "next/link";
import { headers } from "next/headers";
import BrandLogo from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

/**
 * "Where is HarmeLearn right now?" helper page.
 * Renders the CURRENT live URL (from the request host) plus the default
 * entry points — so if the preview rotates, this page always tells you
 * exactly where the app is.
 */
export default async function LivePage() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const currentUrl = `${proto}://${host || "harmelearn.et"}`;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 p-10 sm:p-12 text-center">
        <div className="mx-auto mb-6 w-fit"><BrandLogo size={56} /></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">HarmeLearn Academy</h1>
        <p className="text-slate-600 mb-8">
          This is the live status page. If a link ever stops working, come back
          here — it always shows the current address.
        </p>

        <div className="bg-slate-900 text-white rounded-xl px-5 py-4 mb-6 break-all">
          <p className="text-xs text-slate-400 mb-1">Current live URL</p>
          <p className="font-mono font-semibold">{currentUrl}</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Open the site →
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Login (admin: admin@harmelearn.et / Admin@12345)
          </Link>
          <Link
            href="/signup"
            className="block w-full py-3 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Sign up (student code: DEMO-STUDENT)
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-8 leading-relaxed">
          HarmeLearn Academy — Learn. Master. Succeed. 🇪🇹
        </p>
      </div>
    </div>
  );
}
