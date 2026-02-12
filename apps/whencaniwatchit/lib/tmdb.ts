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
