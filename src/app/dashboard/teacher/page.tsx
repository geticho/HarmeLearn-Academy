"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) {
          router.push("/login");
          return;
        }
        if (data.user.role !== "teacher") {
          router.push("/not-authorized");
          return;
        }
        setUser(data.user);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 overflow-y-auto`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {sidebarOpen && <span className="font-bold text-lg">HarmeLearn</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-slate-800 p-2 rounded"
          >
            ☰
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard/teacher" },
            { icon: "📚", label: "My Courses", href: "/dashboard/teacher/courses" },
            { icon: "👥", label: "Students", href: "/dashboard/teacher/students" },
            { icon: "📝", label: "Assignments", href: "/dashboard/teacher/assignments" },
            { icon: "📈", label: "Analytics", href: "/dashboard/teacher/analytics" },
            { icon: "🎓", label: "Certificates", href: "/dashboard/teacher/certificates" },
            { icon: "💬", label: "Messages", href: "/dashboard/teacher/messages" },
            { icon: "⚙️", label: "Settings", href: "/dashboard/teacher/settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800 rounded-lg transition"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-800">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
            className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-lg transition"
          >
            {sidebarOpen ? "Logout" : "🚪"}
          </button>
        </div>
      </aside>

        {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-8 sm:px-12 py-7 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, Prof {user.lastName}! 👋</h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 hover:text-slate-900">🔔</button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white flex items-center justify-center font-bold">
              {user.firstName[0]}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 sm:p-12">
          {/* Content is administered centrally on this deployment */}
          <div className="mb-10 bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Course content is managed by your administrator
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              On this school&apos;s HarmeLearn deployment, courses, lessons, videos,
              PDFs and exam questions are published centrally by the
              administrator. Your role here is to teach: monitor progress, grade
              submissions and run live classes. Need new material added? Send it
              to your administrator.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            {[
              { icon: "📚", label: "Active Courses", value: "8", color: "bg-blue-100 text-blue-600" },
              { icon: "👥", label: "Total Students", value: "245", color: "bg-green-100 text-green-600" },
              { icon: "📝", label: "Pending Reviews", value: "12", color: "bg-orange-100 text-orange-600" },
              { icon: "⭐", label: "Average Rating", value: "4.8", color: "bg-purple-100 text-purple-600" },
            ].map((stat, idx) => (
              <div key={idx} className={`p-6 rounded-xl text-white ${stat.color}`}>
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Courses */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Courses</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Mathematics Grade 12",
                  grade: "12",
                  students: "45",
                  lessons: "20",
                  icon: "🔢",
                },
                {
                  title: "Physics Grade 11",
                  grade: "11",
                  students: "38",
                  lessons: "18",
                  icon: "⚛️",
                },
              ].map((course, idx) => (
                <Link
                  key={idx}
                  href={`/dashboard/teacher/course/${idx}`}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-3xl mb-2">{course.icon}</p>
                      <h3 className="font-bold text-slate-900 text-lg">{course.title}</h3>
                    </div>
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      Grade {course.grade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Students</p>
                      <p className="font-bold text-slate-900">{course.students}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Lessons</p>
                      <p className="font-bold text-slate-900">{course.lessons}</p>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
                    Manage
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Submissions</h2>
              <div className="space-y-4">
                {[
                  { student: "Abebe Kebede", assignment: "Chapter 5 Quiz", submitted: "2 hours ago" },
                  { student: "Almaz Teshome", assignment: "Lab Report", submitted: "4 hours ago" },
                  { student: "Dawit Habte", assignment: "Problem Set", submitted: "6 hours ago" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pb-4 border-b border-slate-200 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.student}</p>
                      <p className="text-sm text-slate-600">{item.assignment}</p>
                    </div>
                    <span className="text-sm text-slate-500">{item.submitted}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Scheduled Classes</h2>
              <div className="space-y-4">
                {[
                  { course: "Mathematics Grade 12", time: "Today, 3:00 PM", students: "45" },
                  { course: "Physics Grade 11", time: "Tomorrow, 2:00 PM", students: "38" },
                  { course: "Chemistry Grade 10", time: "Next Tuesday", students: "42" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pb-4 border-b border-slate-200 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.course}</p>
                      <p className="text-sm text-slate-600">{item.students} students</p>
                    </div>
                    <span className="text-sm text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
