import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import OfflineIndicator from "@/components/OfflineIndicator";
import OfflineSync from "@/components/OfflineSync";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StoredDataCleanup from "@/components/StoredDataCleanup";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://harmelearn.et";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "HarmeLearn Academy — AI-Powered Learning for Ethiopian Students",
    template: "%s | HarmeLearn Academy",
  },
  description:
    "HarmeLearn Academy is the AI-powered learning platform for Ethiopian secondary students in Grades 9–12. Watch videos, read notes, practise quizzes and past exams in Mathematics, Physics, Chemistry, Biology, English, History, Geography and Economics.",
  keywords: [
    "HarmeLearn",
    "HarmeLearn Academy",
    "Ethiopian education",
    "Ethiopia LMS",
    "online learning Ethiopia",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "Ethiopian secondary school",
    "practice exams Ethiopia",
    "past exams Ethiopia",
    "mathematics grade 12",
    "physics grade 11",
    "chemistry grade 10",
    "biology grade 9",
    "learning platform Ethiopia",
    "study online Ethiopia",
    "EGSLCE",
    "Ethiopian university entrance exam",
  ],
  authors: [{ name: "HarmeLearn Academy" }],
  creator: "HarmeLearn Academy",
  publisher: "HarmeLearn Academy",
  applicationName: "HarmeLearn Academy",
  generator: "HarmeLearn Academy",
  category: "education",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "HarmeLearn Academy",
    title: "HarmeLearn Academy — Learn. Master. Succeed.",
    description:
      "AI-powered learning platform for Ethiopian secondary students in Grades 9–12. Videos, PDFs, short notes, quizzes and past exams in every subject.",
    images: [
      {
        url: `${APP_URL}/icons/icon-512.png`,
        width: 512,
        height: 512,
        alt: "HarmeLearn Academy logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HarmeLearn Academy — Learn. Master. Succeed.",
    description:
      "AI-powered learning platform for Ethiopian secondary students in Grades 9–12.",
    images: [`${APP_URL}/icons/icon-512.png`],
    creator: "@harmelearn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "HarmeLearn Academy",
      url: APP_URL,
      logo: `${APP_URL}/icons/icon-512.png`,
      description:
        "AI-powered learning platform for Ethiopian secondary students, Grades 9–12.",
      foundingLocation: "Addis Ababa, Ethiopia",
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "HarmeLearn Academy",
      description:
        "AI-powered learning platform for Ethiopian secondary students in Grades 9–12.",
      publisher: { "@id": `${APP_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "EducationalOrganization",
      name: "HarmeLearn Academy",
      url: APP_URL,
      sameAs: [APP_URL],
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icons/icon-512.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icons/icon-512.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" sizes="512x512" />
        <meta name="theme-color" content="#064e3b" />
        <meta name="geo.region" content="ET" />
        <meta name="geo.placename" content="Ethiopia" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-poppins bg-white text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegister />
        <StoredDataCleanup />
        <OfflineSync />
        <OfflineIndicator />
      </body>
    </html>
  );
}
