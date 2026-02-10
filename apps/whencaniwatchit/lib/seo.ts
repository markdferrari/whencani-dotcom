export function buildCanonicalPath(baseUrl: string, searchParams: Record<string, string | undefined>): string {
  const url = new URL(baseUrl);
  
  // Canonical order: view, genre, provider (omit defaults)
  if (searchParams.view && searchParams.view !== 'upcoming') {
    url.searchParams.set('view', searchParams.view);
  }
  
  if (searchParams.genre) {
    url.searchParams.set('genre', searchParams.genre);
  }
  
  if (searchParams.provider) {
    url.searchParams.set('provider', searchParams.provider);
  }
  
  return url.toString();
}

export function buildMovieCanonical(baseUrl: string, movieId: string | number): string {
  return `${baseUrl}/movie/${movieId}`;
}
