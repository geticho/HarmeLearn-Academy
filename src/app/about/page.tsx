import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function AboutPage() {
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
            <Link href="/courses" className="text-slate-700 hover:text-blue-600">Courses</Link>
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
          <h1 className="text-5xl font-bold mb-8">About HarmeLearn Academy</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Transforming Ethiopian education through innovative technology and AI-powered learning
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-pad bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 mb-4">
                HarmeLearn Academy is dedicated to democratizing quality education for Ethiopian secondary students.
                We believe every student deserves access to world-class learning resources and expert guidance.
              </p>
              <p className="text-lg text-slate-600 mb-4">
                By combining cutting-edge AI technology with qualified educators, we're making premium education
                affordable and accessible to students across Ethiopia, regardless of their location or economic background.
              </p>
              <p className="text-lg text-slate-600">
                Our platform empowers teachers to create engaging content and students to master their subjects with confidence.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-green-100 h-96 rounded-2xl flex items-center justify-center text-7xl">
              🎯
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-pad bg-transparent">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: "🎓",
                title: "Excellence in Education",
                description: "We maintain the highest standards in course quality, content accuracy, and teaching methodology.",
              },
              {
                icon: "🤝",
                title: "Inclusivity & Accessibility",
                description: "Education should be accessible to all. We work to remove barriers and provide affordable learning.",
              },
              {
                icon: "💡",
                title: "Innovation & Technology",
                description: "We leverage AI and modern technology to personalize learning and improve student outcomes.",
              },
              {
                icon: "🌱",
                title: "Student Success",
                description: "Every student's success is our success. We're committed to helping them achieve their academic goals.",
              },
              {
                icon: "🔒",
                title: "Trust & Safety",
                description: "We maintain a secure, respectful environment where students and teachers can thrive.",
              },
              {
                icon: "🌍",
                title: "Ethiopian Pride",
                description: "We celebrate Ethiopian culture and education, designed specifically for our students' needs.",
              },
            ].map((value, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition">
                <p className="text-4xl mb-4">{value.icon}</p>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-pad bg-white">
        <div className="container mx-auto px-6 sm:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center">Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                name: "Gati Daba",
                role: "Founder & CEO",
                bio: "software engineering  ",
              },
              {
                name: "iyasu Diba and Bonsa Habtamu ",
                role: "Chief Academic Officer",
                bio: "Former Ministry of Education official, education reform advocate",
              },
              {
                name: "Guduru Alemayehu",
                role: "CTO",
                bio: "AI/ML expert, built educational platforms for thousands of students",
              },
            ].map((member, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                  {member.name[0]}{member.name.split(" ")[1][0]}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                <p className="text-slate-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-pad bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-4 gap-10 text-center">
            {[
              { label: "Active Students", value: "10,000+" },
              { label: "Expert Teachers", value: "200+" },
              { label: "Courses", value: "500+" },
              { label: "Lessons", value: "5,000+" },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-white/90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-pad bg-white">
        <div className="container mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-8">Join the HarmeLearn Community</h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Whether you are a student ready to master your grades or a teacher eager to inspire the next generation,
            HarmeLearn is here to support your educational journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Contact Us
            </Link>
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
