"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[rgba(4,20,18,0.72)] backdrop-blur-md border-b border-emerald-400/20">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <span className="font-bold text-xl text-emerald-50">HarmeLearn</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-emerald-100 hover:text-emerald-300 transition">
              Home
            </Link>
            <Link href="/courses" className="text-emerald-100 hover:text-emerald-300 transition">
              Courses
            </Link>
            <Link href="/search" className="flex items-center gap-1.5 text-emerald-100 hover:text-emerald-300 transition">
              <span>🔍</span> Search
            </Link>
            <Link href="/about" className="text-emerald-100 hover:text-emerald-300 transition">
              About
            </Link>
            <Link href="/contact" className="text-emerald-100 hover:text-emerald-300 transition">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden md:inline-block text-emerald-100 hover:text-emerald-300 transition font-medium"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-block px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Sign Up
            </Link>
            <button
              className="md:hidden text-emerald-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[rgba(4,20,18,0.95)] border-t border-emerald-400/20 p-4">
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-emerald-100 hover:text-emerald-300">Home</Link>
              <Link href="/courses" className="text-emerald-100 hover:text-emerald-300">Courses</Link>
              <Link href="/teachers" className="text-emerald-100 hover:text-emerald-300">Teachers</Link>
              <Link href="/about" className="text-emerald-100 hover:text-emerald-300">About</Link>
              <Link href="/login" className="text-emerald-100 hover:text-emerald-300">Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Soft glow only — keep the global green fluid background visible */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-teal-900/25 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
        </div>

        <div className="container mx-auto px-6 sm:px-8 py-24 md:py-28 relative z-10 grid md:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="animate-fade">
            <h1 className="text-5xl md:text-6xl font-bold text-emerald-50 mb-8 leading-tight">
              Learn. Master. <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">Succeed</span>
            </h1>
            <p className="text-xl text-emerald-100/85 mb-10 leading-relaxed">
              AI-powered learning platform designed for Ethiopian secondary students. Master Grades 9-12 with personalized lessons, live classes, and expert teachers.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mb-16">
              <Link
                href="/signup"
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-lg font-semibold hover:shadow-lg transition text-center"
              >
                Start Learning Free
              </Link>
              <Link
                href="/courses"
                className="px-8 py-3 border-2 border-emerald-300 text-emerald-100 rounded-lg font-semibold hover:bg-emerald-400/10 transition text-center"
              >
                Explore Courses
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-bold text-emerald-300">500+</p>
                <p className="text-sm text-emerald-100/75">Courses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-300">10K+</p>
                <p className="text-sm text-emerald-100/75">Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-300">200+</p>
                <p className="text-sm text-emerald-100/75">Teachers</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="hidden md:flex justify-center animate-slide-right">
            <div className="relative w-full max-w-md">
              <div className="aspect-square bg-[rgba(6,28,24,0.55)] border border-emerald-300/25 rounded-2xl flex items-center justify-center text-6xl backdrop-blur-md">
                📚
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/90 rounded-xl flex items-center justify-center text-5xl shadow-lg">
                🎓
              </div>
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-teal-400/90 rounded-xl flex items-center justify-center text-4xl shadow-lg">
                💡
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-pad bg-transparent">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-center mb-6 text-white drop-shadow">Why Choose HarmeLearn?</h2>
          <p className="text-center text-emerald-50 mb-24 max-w-2xl mx-auto text-lg">
            Designed specifically for Ethiopian education system with modern learning tools and AI support.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Learning",
                description: "Personalized study recommendations and AI tutors to help you master concepts faster."
              },
              {
                icon: "👨‍🏫",
                title: "Expert Teachers",
                description: "Learn from qualified educators with live interactive classes and real-time feedback."
              },
              {
                icon: "📱",
                title: "Learn Anywhere",
                description: "Access courses on any device. Download content for offline learning."
              },
              {
                icon: "🎯",
                title: "Track Progress",
                description: "Detailed analytics showing your performance, weak areas, and improvement suggestions."
              },
              {
                icon: "🏆",
                title: "Earn Certificates",
                description: "Complete courses and earn verified certificates recognized in education."
              },
              {
                icon: "💬",
                title: "Community Support",
                description: "Discuss with peers, ask questions, and learn from the community forum."
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-emerald-300/25 bg-[rgba(4,22,18,0.78)] backdrop-blur-md p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
              >
                <p className="text-4xl mb-5">{feature.icon}</p>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-emerald-50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="section-pad">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-center mb-24 text-white drop-shadow">Available Subjects</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { name: "Mathematics", emoji: "🔢", color: "from-blue-400 to-blue-600" },
              { name: "Physics", emoji: "⚛️", color: "from-purple-400 to-purple-600" },
              { name: "Chemistry", emoji: "🧪", color: "from-green-400 to-green-600" },
              { name: "Biology", emoji: "🧬", color: "from-red-400 to-red-600" },
              { name: "English", emoji: "📖", color: "from-yellow-400 to-yellow-600" },
              { name: "History", emoji: "🏛️", color: "from-amber-400 to-amber-600" },
              { name: "Geography", emoji: "🌍", color: "from-cyan-400 to-cyan-600" },
              { name: "Economics", emoji: "💹", color: "from-indigo-400 to-indigo-600" }
            ].map((subject, idx) => (
              <Link
                key={idx}
                href={`/courses?subject=${subject.name.toLowerCase()}`}
                className={`bg-gradient-to-br ${subject.color} text-white p-8 rounded-xl flex flex-col items-center justify-center gap-4 hover:shadow-lg transition hover:scale-105`}
              >
                <p className="text-5xl">{subject.emoji}</p>
                <p className="font-bold text-lg text-center">{subject.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad bg-transparent">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-center mb-24 text-white drop-shadow">Student Success Stories</h2>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                name: "Hawi Gurmu",
                grade: "Grade 12",
                school: "Nekemte",
                message: "HarmeLearn helped me improve my Math grade from D to A. The AI tutor is amazing!",
                rating: 5
              },
              {
                name: "Bay'isa Birraa",
                grade: "Grade 10",
                school: "Ambo",
                message: "The live classes with expert teachers made learning so much easier. Highly recommended!",
                rating: 5
              },
              {
                name: "Michu Horro",
                grade: "Grade 9",
                school: "Shambu",
                message: "Best platform for exam preparation. Practice exams are exactly like the real ones.",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-emerald-300/25 bg-[rgba(4,22,18,0.78)] backdrop-blur-md p-8 shadow-xl"
              >
                <p className="text-yellow-300 mb-4 text-lg">{"⭐".repeat(testimonial.rating)}</p>
                <p className="text-emerald-50 mb-8 italic leading-relaxed text-base">
                  "{testimonial.message}"
                </p>
                <div className="pt-5 border-t border-emerald-300/20">
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-emerald-100">
                    {testimonial.grade} • {testimonial.school}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad-lg bg-gradient-to-r from-emerald-700/80 to-teal-600/80 text-emerald-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Transform Your Learning?</h2>
          <p className="text-xl mb-12 text-emerald-50/90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Ethiopian students who are already mastering their grades with HarmeLearn.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-emerald-100 text-emerald-950 rounded-lg font-bold hover:bg-white transition text-center"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-emerald-100 text-emerald-50 rounded-lg font-bold hover:bg-emerald-100/10 transition text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[rgba(2,12,10,0.85)] text-emerald-50 py-16 border-t border-emerald-400/15">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo size={32} />
                <span className="font-bold">HarmeLearn</span>
              </div>
              <p className="text-emerald-100/70 text-sm">AI-powered learning platform for Ethiopian secondary students.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="text-emerald-100/70 text-sm space-y-2">
                <li><Link href="/courses" className="hover:text-emerald-200 transition">Courses</Link></li>
                <li><Link href="/teachers" className="hover:text-emerald-200 transition">Teachers</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-200 transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="text-emerald-100/70 text-sm space-y-2">
                <li><Link href="/about" className="hover:text-emerald-200 transition">About</Link></li>
                <li><Link href="/blog" className="hover:text-emerald-200 transition">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-200 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="text-emerald-100/70 text-sm space-y-2">
                <li><Link href="/privacy" className="hover:text-emerald-200 transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-200 transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-400/15 pt-10 text-center text-emerald-100/65 text-sm">
            <p>&copy; {new Date().getFullYear()} HarmeLearn Academy. All rights reserved. Made for Ethiopian Education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
