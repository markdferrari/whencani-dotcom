/**
 * Shared utilities for watchlist functionality
 */

export type ReleaseGroup = 'released' | 'coming-soon' | 'this-month' | 'later' | 'tba';

export interface GroupedItem<T> {
  group: ReleaseGroup;
  item: T;
}

/**
 * Determines the release group for a given date
 */
function getReleaseGroup(releaseDate: string | null | undefined): ReleaseGroup {
  if (!releaseDate) {
    return 'tba';
  }

  const release = new Date(releaseDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const releaseDay = new Date(release.getFullYear(), release.getMonth(), release.getDate());

  // Check if released (in the past)
  if (releaseDay < today) {
    return 'released';
  }

  // Check if coming soon (next 7 days)
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  if (releaseDay <= sevenDaysFromNow) {
    return 'coming-soon';
  }

  // Check if this month (same month, but beyond 7 days)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  if (releaseDay <= endOfMonth) {
    return 'this-month';
  }

  // Everything else is later
  return 'later';
}

/**
 * Groups items by their release date into categories
 */
export function groupByReleaseDate<T extends { releaseDate?: string | null }>(
  items: T[]
): Record<ReleaseGroup, T[]> {
  const groups: Record<ReleaseGroup, T[]> = {
    'released': [],
    'coming-soon': [],
    'this-month': [],
    'later': [],
    'tba': [],
  };

  for (const item of items) {
    const group = getReleaseGroup(item.releaseDate);
    groups[group].push(item);
  }

  return groups;
}

/**
 * Sorts items based on the specified sort mode
 */
export function sortItems<T>(
  items: T[],
  sortBy: 'date-added' | 'release-soonest' | 'release-latest' | 'alphabetical',
  extractors: {
    title: (item: T) => string;
    releaseDate: (item: T) => string | null | undefined;
  }
): T[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'date-added':
      // Natural order in cookie is oldest first, newest last
      // Reverse it to show newest first
      return sorted.reverse();

    case 'release-soonest': {
      return sorted.sort((a, b) => {
        const dateA = extractors.releaseDate(a);
        const dateB = extractors.releaseDate(b);

        // Items without dates go to the end
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();

        return timeA - timeB;
      });
    }

    case 'release-latest': {
      return sorted.sort((a, b) => {
        const dateA = extractors.releaseDate(a);
        const dateB = extractors.releaseDate(b);

        // Items without dates go to the end
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();

        return timeB - timeA;
      });
    }

    case 'alphabetical': {
      return sorted.sort((a, b) => {
        const titleA = extractors.title(a).toLowerCase();
        const titleB = extractors.title(b).toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }

    default:
      return sorted;
  }
}

/**
 * Extracts unique genres from a list of items
 */
export function extractUniqueGenres<T extends { genres?: string[] }>(
  items: T[]
): Array<{ id: string; name: string }> {
  const genreSet = new Set<string>();

  for (const item of items) {
    if (item.genres) {
      for (const genre of item.genres) {
        genreSet.add(genre);
      }
    }
  }

  const genres = Array.from(genreSet).sort();
  return genres.map((genre) => ({ id: genre, name: genre }));
}

/**
 * Filters items by genre
 */
export function filterByGenre<T extends { genres?: string[] }>(
  items: T[],
  genre?: string
): T[] {
  if (!genre) {
    return items;
  }

  return items.filter((item) => item.genres?.includes(genre));
}

/**
 * Checks if an item was released recently (within threshold days)
 */
export function isReleasedRecently(
  releaseDate: string | null | undefined,
  daysThreshold: number = 7
): boolean {
  if (!releaseDate) {
    return false;
  }

  const release = new Date(releaseDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const releaseDay = new Date(release.getFullYear(), release.getMonth(), release.getDate());

  // Not released yet
  if (releaseDay >= today) {
    return false;
  }

  // Check if within threshold
  const thresholdDate = new Date(today);
  thresholdDate.setDate(today.getDate() - daysThreshold);

  return releaseDay >= thresholdDate;
}
