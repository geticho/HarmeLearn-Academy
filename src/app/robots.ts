import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://harmelearn.et";

/** Tells search engines how to crawl HarmeLearn and where the sitemap is. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/dashboard", "/login"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
