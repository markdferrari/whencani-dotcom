import { TMDBMovie } from "@/lib/tmdb";

export function MovieItemListSchema(baseUrl: string, movies: TMDBMovie[]): string {
  const items = movies.slice(0, 10).map((movie, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": movie.title,
    "url": `${baseUrl}/movie/${movie.id}`,
    "image":
      movie.poster_path || movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path || movie.backdrop_path}`
        : undefined,
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.filter((item) => item.image !== undefined),
  });
}

export function MovieSchema(
  baseUrl: string,
  movie: {
    id: string | number;
    title: string;
    overview?: string | null;
    release_date?: string | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number | null;
    vote_count?: number | null;
    director?: string | null;
    cast?: Array<{ name: string }> | null;
  }
): string {
  const schema: {
    "@context": string;
    "@type": string;
    name: string;
    description?: string;
    image?: string;
    datePublished?: string;
    url: string;
    director?: { "@type": string; name: string };
    actor?: Array<{ "@type": string; name: string }>;
    aggregateRating?: { "@type": string; ratingValue: number; ratingCount: number };
  } = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url: `${baseUrl}/movie/${movie.id}`,
  };

  if (movie.overview) {
    schema.description = movie.overview;
  }

  if (movie.poster_path || movie.backdrop_path) {
    schema.image = `https://image.tmdb.org/t/p/w342${movie.poster_path || movie.backdrop_path}`;
  }

  if (movie.release_date) {
    schema.datePublished = movie.release_date;
  }

  if (movie.director) {
    schema.director = {
      "@type": "Person",
      name: movie.director,
    };
  }

  if (movie.cast && movie.cast.length > 0) {
    schema.actor = movie.cast.slice(0, 5).map((actor) => ({
      "@type": "Person",
      name: actor.name,
    }));
  }

  if (movie.vote_average && movie.vote_count) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(movie.vote_average.toFixed(1)),
      ratingCount: movie.vote_count,
    };
  }

  return JSON.stringify(schema);
}

export function BreadcrumbListSchema(baseUrl: string, pageName: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: `${baseUrl}${pageName && pageName !== "Home" ? `/${pageName.toLowerCase()}` : ""}`
      },
    ],
  });
}

export function ShowSchema(
  baseUrl: string,
  show: {
    id: string | number;
    title: string;
    overview?: string | null;
    release_date?: string | null;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number | null;
    vote_count?: number | null;
    director?: string | null;
    cast?: Array<{ name: string }> | null;
  }
): string {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: show.title,
    url: `${baseUrl}/show/${show.id}`,
  };

  if (show.overview) schema.description = show.overview;
  if (show.poster_path || show.backdrop_path) schema.image = `https://image.tmdb.org/t/p/w342${show.poster_path || show.backdrop_path}`;
  if (show.release_date) schema.datePublished = show.release_date;
  if (show.director) schema.director = { "@type": "Person", name: show.director };
  if (show.cast && show.cast.length > 0) schema.actor = show.cast.slice(0, 5).map((a) => ({ "@type": "Person", name: a.name }));
  if (show.vote_average && show.vote_count) schema.aggregateRating = { "@type": "AggregateRating", ratingValue: parseFloat(show.vote_average.toFixed(1)), ratingCount: show.vote_count };

  return JSON.stringify(schema);
}
