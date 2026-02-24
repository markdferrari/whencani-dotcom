import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhenCanIPlayIt.com - Game Release Tracker",
    short_name: "WhenCanIPlayIt",
    description:
      "Track game release dates, reviews, and trending titles across PlayStation, Xbox, Nintendo, and PC.",
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
