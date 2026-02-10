import type { MetadataRoute } from "next";
import {
  getMovieGenres,
  getTrendingMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
} from "@/lib/tmdb";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://whencaniwatchit.com";

  try {
    const [genres, trendingMovies, nowPlayingMovies, upcomingMovies] = await Promise.all([
      getMovieGenres(),
      getTrendingMovies(20),
      getNowPlayingMovies(20),
      getUpcomingMovies(20),
    ]);

    const entries: MetadataRoute.Sitemap = [
      // Static routes
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/?view=recent`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/watchlist`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];

    // Add top genres (limit to 12 to avoid sitemap bloat)
    const topGenres = genres.slice(0, 12);
    topGenres.forEach((genre) => {
      entries.push({
        url: `${baseUrl}/?view=upcoming&genre=${genre.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    // Add movies from trending, now playing, and upcoming
    const uniqueMovies = new Map<number | string, number | string>();

    [trendingMovies, nowPlayingMovies, upcomingMovies].forEach((movies) => {
      movies.forEach((movie) => {
        uniqueMovies.set(movie.id, movie.id);
      });
    });

    uniqueMovies.forEach((movieId) => {
      entries.push({
        url: `${baseUrl}/movie/${movieId}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

    return entries;
  } catch (error) {
    console.error("Sitemap generation error:", error);

    // Return minimal sitemap on error
    return [
      {
        url: "https://whencaniwatchit.com",
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/?view=recent`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
