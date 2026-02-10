import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/movie/", "/watchlist"],
        disallow: ["/api/", "/_next/", "/static/"],
      },
    ],
    sitemap: "https://whencaniwatchit.com/sitemap.xml",
  };
}
