const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: number | string;
  title: string;
  imageUrl: string | null;
  href: string;
  releaseDate: string | null;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentView(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  const current = getRecentlyViewed();
  const filtered = current.filter((i) => i.id !== item.id);
  const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRecentlyViewed() {
  localStorage.removeItem(STORAGE_KEY);
}