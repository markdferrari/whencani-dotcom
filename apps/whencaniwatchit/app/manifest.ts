import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhenCanIWatchIt.com - Movie Release Tracker",
    short_name: "WhenCanIWatchIt",
    description:
      "Track new and upcoming movie releases. Browse by genre, see what's trending, and save your favourite films.",
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
