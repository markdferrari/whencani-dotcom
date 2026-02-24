import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhenCanIReadIt.com - Book Release Tracker",
    short_name: "WhenCanIReadIt",
    description:
      "Track upcoming book releases, bestsellers, and new titles. Browse by genre, save to your bookshelf, and never miss a release.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
