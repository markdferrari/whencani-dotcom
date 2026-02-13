type CoverSize = 'S' | 'M' | 'L';

export function getOpenLibraryCoverUrl(isbn: string, size: CoverSize = 'L'): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

export async function getOpenLibraryCover(isbn: string): Promise<string | null> {
  const url = getOpenLibraryCoverUrl(isbn, 'L');

  try {
    // Check if cover exists (Open Library returns a 1x1 pixel for missing covers)
    const res = await fetch(url, { method: 'HEAD', next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    // A 1x1 placeholder is typically under 1KB
    if (contentLength && parseInt(contentLength, 10) < 1000) return null;

    return url;
  } catch {
    return null;
  }
}
