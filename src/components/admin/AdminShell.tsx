"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export interface AdminShellUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const NAV = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/students", label: "Students", icon: "👨‍🎓" },
  { href: "/admin/teachers", label: "Teachers", icon: "👨‍🏫" },
  { href: "/admin/subjects", label: "Subjects", icon: "📋" },
  { href: "/admin/curriculum", label: "Curriculum", icon: "🗂️" },
  { href: "/admin/upload", label: "Upload Content", icon: "📤" },
  { href: "/admin/content", label: "Videos · PDFs · Notes", icon: "🎬" },
  { href: "/admin/past-exams", label: "Past Exams", icon: "📋" },
  { href: "/admin/codes", label: "Registration Codes", icon: "🔑" },
  { href: "/admin/questions", label: "Question Bank", icon: "❓" },
  { href: "/admin/courses", label: "Courses", icon: "📚" },
];

export default function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "block" : "hidden"
        } lg:block lg:w-64 shrink-0 bg-slate-900 text-white lg:min-h-screen`}
      >
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div>
              <p className="font-bold leading-tight">HarmeLearn</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                Admin Console
              </p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1.5">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                  active
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-4 border-t border-slate-800">
          <p className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-slate-400 mb-3 capitalize">
            {user.role.replace("_", " ")}
          </p>
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm bg-slate-800 hover:bg-red-600 rounded-lg transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <span className="font-bold">HarmeLearn Admin</span>
          <button onClick={() => setOpen(!open)} className="text-2xl leading-none">
            ☰
          </button>
        </header>
        <main className="p-6 sm:p-10 lg:p-12">{children}</main>
      </div>
    </div>
  );
}
