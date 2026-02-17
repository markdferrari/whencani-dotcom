import { config } from './config';

export const TMDB_BASE_URL = config.tmdb.baseUrl;
export const TMDB_IMAGE_BASE = config.tmdb.imageBaseUrl;

export type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
};

export type TMDBGenre = {
  id: number;
  name: string;
};

export type TMDBWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

export type TMDBWatchProviderData = {
  results: {
    [key: string]: {
      link?: string;
      flatrate?: TMDBWatchProvider[];
      rent?: TMDBWatchProvider[];
      buy?: TMDBWatchProvider[];
    };
  };
};

export type TMDBCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string | null;
};

export type TMDBCrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type TMDBCredits = {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
};

export type TMDBMovieDetails = TMDBMovie & {
  adult: boolean;
  genres: TMDBGenre[];
  homepage: string | null;
  imdb_id: string | null;
  original_language: string;
  production_companies: { id: number; name: string }[];
  runtime: number | null;
  status: string;
  tagline: string | null;
};

export type TMDBVideo = {
  id: string;
  iso_639_1?: string | null;
  iso_3166_1?: string | null;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official?: boolean;
  published_at?: string;
};

export type TMDBImage = {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
};

export type TMDBImagesResponse = {
  id: number;
  backdrops: TMDBImage[];
  posters: TMDBImage[];
  logos: TMDBImage[];
};

type TMDBPersonExternalIds = {
  imdb_id: string | null;
};

const DEFAULT_FETCH_PARAMS = {
  region: "US",
  language: "en-US",
  include_adult: "false",
  page: "1",
};

type TMDBListResponse = {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
};

type TMDBGenreResponse = {
  genres: TMDBGenre[];
};

const buildParams = (overrides: Record<string, string | number> = {}) => {
  return new URLSearchParams({
    api_key: config.tmdb.apiKey,
    ...DEFAULT_FETCH_PARAMS,
    ...Object.fromEntries(
      Object.entries(overrides).map(([key, value]) => [key, String(value)])
    ),
  });
};

const CACHE_TTL_SECONDS = 30 * 60;

const tmdbFetch = async <T>(path: string, params?: Record<string, string | number>) => {
  if (!config.tmdb.apiKey) {
    throw new Error("TMDB_API_KEY is not defined");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.search = buildParams(params).toString();

  const res = await fetch(url.toString(), {
    next: { revalidate: CACHE_TTL_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`);
  }

  return (await res.json()) as T;
};

export const formatReleaseDate = (
  value?: string | null,
  options?: Intl.DateTimeFormatOptions
) => {
  if (!value) {
    return "TBD";
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      ...options,
    });
    return formatter.format(new Date(value));
  } catch {
    return value;
  }
};

export const getPosterUrl = (path?: string | null, size = "w342") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const getBackdropUrl = (path?: string | null, size = "w780") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const getProfileUrl = (path?: string | null, size = "w185") =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const searchMovies = async (query: string, limit = 10): Promise<TMDBMovie[]> => {
  if (!query.trim()) return [];
  const data = await tmdbFetch<TMDBListResponse>('/search/movie', {
    query: query.trim(),
  });
  return data.results.slice(0, limit);
};

export const getUpcomingMovies = async (limit = 12, genreId?: number, providerId?: number) => {
  const data = await tmdbFetch<TMDBListResponse>("/movie/upcoming", { page: 1 });
  const today = new Date();

  let movies = data.results
    .filter((movie) => {
      if (!movie.release_date || new Date(movie.release_date) < today) {
        return false;
      }
      if (genreId && !movie.genre_ids?.includes(genreId)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.release_date ?? "").getTime();
      const dateB = new Date(b.release_date ?? "").getTime();
      return dateA - dateB;
    });

  if (providerId === 0) {
    // Theatrical/cinema releases - all movies from upcoming are theatrical
    return movies.slice(0, limit);
  }

  if (providerId) {
    const filtered = [];
    for (const movie of movies) {
      const providers = await getMovieWatchProviders(movie.id);
      if (providers.some((p) => p.provider_id === providerId)) {
        filtered.push(movie);
      }
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  return movies.slice(0, limit);
};

export const getTrendingMovies = async (limit = 8) => {
  const data = await tmdbFetch<TMDBListResponse>("/trending/movie/week");
  return data.results.slice(0, limit);
};

export const getTrendingTheatrical = async (limit = 8) => {
  const nowPlayingData = await tmdbFetch<TMDBListResponse>("/movie/now_playing");
  const upcomingData = await tmdbFetch<TMDBListResponse>("/movie/upcoming");
  
  const theatricalMovies = [...nowPlayingData.results, ...upcomingData.results];
  
  // Sort by popularity
  return theatricalMovies
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

export const getTrendingStreaming = async (limit = 8) => {
  const trendingData = await tmdbFetch<TMDBListResponse>("/trending/movie/week");
  
  const filtered = [];
  for (const movie of trendingData.results) {
    const providers = await getMovieWatchProviders(movie.id);
    if (providers.length > 0) {
      filtered.push(movie);
    }
    if (filtered.length >= limit) break;
  }
  
  return filtered;
};

export const getNowPlayingMovies = async (limit = 9) => {
  const data = await tmdbFetch<TMDBListResponse>("/movie/now_playing");
  return data.results.slice(0, limit);
};

export const getNowPlayingRecent = async (limit = 12, genreId?: number, providerId?: number) => {
  const data = await tmdbFetch<TMDBListResponse>("/movie/now_playing");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let movies = data.results
    .filter((movie) => {
      if (!movie.release_date) return false;
      const releaseDate = new Date(movie.release_date);
      if (releaseDate < thirtyDaysAgo || releaseDate > new Date()) {
        return false;
      }
      if (genreId && !movie.genre_ids?.includes(genreId)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.release_date ?? "").getTime();
      const dateB = new Date(b.release_date ?? "").getTime();
      return dateB - dateA;
    });

  if (providerId === 0) {
    // Theatrical/cinema releases - all movies from now_playing are theatrical
    return movies.slice(0, limit);
  }

  if (providerId) {
    const filtered = [];
    for (const movie of movies) {
      const providers = await getMovieWatchProviders(movie.id);
      if (providers.some((p) => p.provider_id === providerId)) {
        filtered.push(movie);
      }
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  return movies.slice(0, limit);
};

export const getNowStreamingRecent = async (limit = 12, genreId?: number, providerId?: number) => {
  const data = await tmdbFetch<TMDBListResponse>("/trending/movie/week");
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let movies = data.results
    .filter((movie) => {
      if (!movie.release_date) return false;
      const releaseDate = new Date(movie.release_date);
      if (releaseDate < sixtyDaysAgo || releaseDate > new Date()) {
        return false;
      }
      if (genreId && !movie.genre_ids?.includes(genreId)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.release_date ?? "").getTime();
      const dateB = new Date(b.release_date ?? "").getTime();
      return dateB - dateA;
    });

  if (providerId === 0) {
    // streaming-only view (providerId 0 not meaningful here but keep parity)
    return movies.slice(0, limit);
  }

  if (providerId) {
    const filtered: TMDBMovie[] = [];
    for (const movie of movies) {
      const providers = await getMovieWatchProviders(movie.id);
      if (providers.some((p) => p.provider_id === providerId)) {
        filtered.push(movie);
      }
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  // Ensure the movie is actually available on at least one streaming provider
  const withProviders: TMDBMovie[] = [];
  for (const movie of movies) {
    const providers = await getMovieWatchProviders(movie.id);
    if (providers.length > 0) {
      withProviders.push(movie);
    }
    if (withProviders.length >= limit) break;
  }

  return withProviders;
};

export const getMovieGenres = async () => {
  const data = await tmdbFetch<TMDBGenreResponse>("/genre/movie/list");
  return data.genres;
};

export const getMovieWatchProviders = async (movieId: number) => {
  try {
    const data = await tmdbFetch<TMDBWatchProviderData>(`/movie/${movieId}/watch/providers`);
    const usProviders = data.results?.US;
    if (!usProviders) return [];
    
    const providers: TMDBWatchProvider[] = [
      ...(usProviders.flatrate || []),
      ...(usProviders.rent || []),
      ...(usProviders.buy || []),
    ];
    
    return providers.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);
  } catch {
    return [];
  }
};

export const getMovieWatchProvidersWithLink = async (movieId: number) => {
  try {
    const data = await tmdbFetch<TMDBWatchProviderData>(`/movie/${movieId}/watch/providers`);
    const usProviders = data.results?.US;
    if (!usProviders) return { providers: [], link: undefined };

    const providers: TMDBWatchProvider[] = [
      ...(usProviders.flatrate || []),
      ...(usProviders.rent || []),
      ...(usProviders.buy || []),
    ];

    const unique = providers.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);
    return { providers: unique, link: usProviders.link };
  } catch {
    return { providers: [], link: undefined };
  }
};

export const getTVWatchProviders = async (tvId: number) => {
  try {
    const data = await tmdbFetch<TMDBWatchProviderData>(`/tv/${tvId}/watch/providers`);
    const usProviders = data.results?.US;
    if (!usProviders) return [];

    const providers: TMDBWatchProvider[] = [
      ...(usProviders.flatrate || []),
      ...(usProviders.rent || []),
      ...(usProviders.buy || []),
    ];

    return providers.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);
  } catch {
    return [];
  }
};

export const getTVWatchProvidersWithLink = async (tvId: number) => {
  try {
    const data = await tmdbFetch<TMDBWatchProviderData>(`/tv/${tvId}/watch/providers`);
    const usProviders = data.results?.US;
    if (!usProviders) return { providers: [], link: undefined };

    const providers: TMDBWatchProvider[] = [
      ...(usProviders.flatrate || []),
      ...(usProviders.rent || []),
      ...(usProviders.buy || []),
    ];

    const unique = providers.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i);
    return { providers: unique, link: usProviders.link };
  } catch {
    return { providers: [], link: undefined };
  }
};

// Return recently released TV shows that are available on streaming providers
export const getNowStreamingTVRecent = async (limit = 12, genreId?: number, providerId?: number) => {
  const data = await tmdbFetch<TMDBListResponse>("/trending/tv/week");
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // TMDB TV objects have `name` and `first_air_date`; normalize to movie-like shape
  const normalized = data.results.map((item) => ({
    id: item.id,
    title: 
      (item as any).name || item.title || "",
    overview: item.overview,
    release_date: 
      (item as any).first_air_date || item.release_date || null,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity,
    genre_ids: item.genre_ids,
  })) as TMDBMovie[];

  let shows = normalized
    .filter((show) => {
      if (!show.release_date) return false;
      const releaseDate = new Date(show.release_date);
      if (releaseDate < sixtyDaysAgo || releaseDate > new Date()) {
        return false;
      }
      if (genreId && !show.genre_ids?.includes(genreId)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.release_date ?? "").getTime();
      const dateB = new Date(b.release_date ?? "").getTime();
      return dateB - dateA;
    });

  if (providerId === 0) {
    return shows.slice(0, limit);
  }

  if (providerId) {
    const filtered: TMDBMovie[] = [];
    for (const show of shows) {
      const providers = await getTVWatchProviders(show.id);
      if (providers.some((p) => p.provider_id === providerId)) {
        filtered.push(show);
      }
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  const withProviders: TMDBMovie[] = [];
  for (const show of shows) {
    const providers = await getTVWatchProviders(show.id);
    if (providers.length > 0) {
      withProviders.push(show);
    }
    if (withProviders.length >= limit) break;
  }

  return withProviders;
};

export const getMoviesByIds = async (ids: number[]): Promise<TMDBMovie[]> => {
  if (ids.length === 0) {
    return [];
  }

  const normalizedIds = Array.from(
    new Set(ids.map((id) => Number(id)).filter((value) => Number.isFinite(value)))
  );
  
  if (normalizedIds.length === 0) {
    return [];
  }

  try {
    const movies = await Promise.all(
      normalizedIds.map((id) =>
        tmdbFetch<TMDBMovie>(`/movie/${id}`).catch(() => null)
      )
    );

    return movies.filter((movie): movie is TMDBMovie => movie !== null);
  } catch (error) {
    console.error('Failed to fetch movies by IDs', error);
    return [];
  }
};

export const getMovieDetails = async (id: string) => {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${id}`);
};

export const getMovieCredits = async (id: string) => {
  return tmdbFetch<TMDBCredits>(`/movie/${id}/credits`);
};

export const getPersonExternalIds = async (personId: number) => {
  return tmdbFetch<TMDBPersonExternalIds>(`/person/${personId}/external_ids`);
};

export const getMovieVideos = async (id: string) => {
  return tmdbFetch<{ results: TMDBVideo[] }>(`/movie/${id}/videos`);
};

export const getMovieImages = async (id: string) => {
  return tmdbFetch<TMDBImagesResponse>(`/movie/${id}/images`, { include_image_language: "en,null" });
};

export type TMDBTVDetails = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genres: TMDBGenre[];
  episode_run_time?: number[];
  production_companies?: { id: number; name: string }[];
  tagline?: string | null;
};

export const getTVDetails = async (id: string) => {
  return tmdbFetch<TMDBTVDetails>(`/tv/${id}`);
};

export const getTVCredits = async (id: string) => {
  return tmdbFetch<TMDBCredits>(`/tv/${id}/credits`);
};

export const getTVVideos = async (id: string) => {
  return tmdbFetch<{ results: TMDBVideo[] }>(`/tv/${id}/videos`);
};

export const getTVImages = async (id: string) => {
  return tmdbFetch<TMDBImagesResponse>(`/tv/${id}/images`, { include_image_language: "en,null" });
};

export const getMoviesForDateRange = async (startDate: string, endDate: string, genreId?: number) => {
  const params: Record<string, string | number> = {
    'primary_release_date.gte': startDate,
    'primary_release_date.lte': endDate,
    page: 1,
  };
  if (genreId) params.with_genres = genreId;

  const data = await tmdbFetch<TMDBListResponse>('/discover/movie', params);
  return data.results;
};
