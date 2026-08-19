import type { MetadataRoute } from "next";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, pastExams, subjects } from "@/db/schema";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://harmelearn.et";

/**
 * Search-engine sitemap: static pages + every public course, subject and
 * past exam. Submitted to Google via /robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/courses`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [courseRows, subjectRows, examRows] = await Promise.all([
      db
        .select({
          slug: courses.slug,
          updatedAt: courses.updatedAt,
        })
        .from(courses)
        .where(eq(courses.isPublished, true))
        .limit(1000),
      db
        .select({ id: subjects.id, name: subjects.name })
        .from(subjects)
        .orderBy(sql`${subjects.name} asc`)
        .limit(200),
      db
        .select({ id: pastExams.id, updatedAt: pastExams.updatedAt })
        .from(pastExams)
        .where(eq(pastExams.isPublished, true))
        .limit(1000),
    ]);

    return [
      ...staticEntries,
      ...courseRows.map((c) => ({
        url: `${BASE}/course/${c.slug}`,
        lastModified: c.updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...subjectRows.map((s) => ({
        url: `${BASE}/courses?subject=${encodeURIComponent(s.name)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...examRows.map((e) => ({
        url: `${BASE}/search?q=${encodeURIComponent("past exam")}`,
        lastModified: e.updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
