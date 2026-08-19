"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSuccess(true);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setLoading(false);

    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={40} />
            <span className="font-bold text-xl">HarmeLearn</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-700 hover:text-blue-600">Home</Link>
            <Link href="/about" className="text-slate-700 hover:text-blue-600">About</Link>
            <Link href="/login" className="text-slate-700 hover:text-blue-600">Login</Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-24">
        <div className="container mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-5xl font-bold mb-8">Get in Touch</h1>
          <p className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section-pad">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "📧",
                title: "Email",
                contact: "support@harmelearn.com",
                description: "Send us an email anytime",
              },
              {
                icon: "📱",
                title: "Phone",
                contact: "+251 (0) 123-456-7890",
                description: "Call us during business hours",
              },
              {
                icon: "📍",
                title: "Address",
                contact: "Addis Ababa, Ethiopia",
                description: "Visit our office",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-slate-200 text-center hover:shadow-lg transition">
                <p className="text-4xl mb-4">{item.icon}</p>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-lg font-semibold text-blue-600 mb-2">{item.contact}</p>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-white p-10 sm:p-12 rounded-2xl border border-slate-200 shadow-lg">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✅ Thank you for your message! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Abebe Kebede"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="abebe@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+251..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-pad bg-transparent">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center">Frequently Asked Questions</h2>

          <div className="max-w-2xl mx-auto space-y-4">
            {[
              {
                question: "How much does HarmeLearn cost?",
                answer: "We offer free access to many courses, with premium features available through subscriptions starting at affordable rates.",
              },
              {
                question: "Can teachers upload their own content?",
                answer: "Yes! Teachers can upload videos, PDFs, create quizzes, and manage assignments for their courses.",
              },
              {
                question: "Is HarmeLearn available offline?",
                answer: "Yes, students can download courses and lessons to study offline on our mobile app.",
              },
              {
                question: "How are teachers verified?",
                answer: "We have a verification process to ensure teachers meet our quality standards and have proper qualifications.",
              },
            ].map((faq, idx) => (
              <details key={idx} className="bg-white p-6 rounded-lg border border-slate-200 group">
                <summary className="font-bold text-slate-900 cursor-pointer flex justify-between items-center">
                  {faq.question}
                  <span className="group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="text-slate-600 mt-4 pt-4 border-t border-slate-200">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6 sm:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} HarmeLearn Academy. All rights reserved. Designed for Ethiopian Education.</p>
        </div>
      </footer>
    </div>
  );
}
