export const BOOKSHELF_COOKIE_NAME = 'bookshelf';
export const BOOKSHELF_MAX_ITEMS = 100;

export function parseBookshelfCookie(value?: string | null): string[] {
  if (!value) return [];

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
  } catch {
    return [];
  }
}

export function serializeBookshelf(ids: string[]): string {
  return JSON.stringify(ids);
}

export function addToBookshelf(ids: string[], bookId: string): string[] {
  const normalized = ids.filter((id) => id !== bookId);
  const updated = [...normalized, bookId];

  if (updated.length <= BOOKSHELF_MAX_ITEMS) {
    return updated;
  }

  return updated.slice(updated.length - BOOKSHELF_MAX_ITEMS);
}

export function removeFromBookshelf(ids: string[], bookId: string): string[] {
  return ids.filter((id) => id !== bookId);
}
