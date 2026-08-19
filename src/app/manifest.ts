import type { MetadataRoute } from "next";

/** PWA manifest — makes HarmeLearn installable and offline-capable. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HarmeLearn Academy",
    short_name: "HarmeLearn",
    description:
      "AI-powered learning platform for Ethiopian secondary students, Grades 9–12.",
    start_url: "/",
    display: "standalone",
    background_color: "#03120f",
    theme_color: "#064e3b",
    icons: [
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
