'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { Skeleton } from './skeleton';
import { useDebounce } from '../hooks/use-debounce';
import type { SearchResult } from '../types/search';

export interface SearchBarProps {
  searchEndpoint: string;
  placeholder?: string;
}

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT = 5;
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const trimmed = query.trim();
    if (!trimmed) return;
    const existing = getRecentSearches();
    const updated = [trimmed, ...existing.filter((s) => s !== trimmed)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (e.g. Safari private mode)
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // noop
  }
}

export function SearchBar({
  searchEndpoint,
  placeholder = 'Search...',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setHighlightedIndex(-1);

    fetch(
      `${searchEndpoint}?q=${encodeURIComponent(debouncedQuery.trim())}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data: { results: SearchResult[] }) => {
        if (!controller.signal.aborted) {
          setResults(data.results);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setResults([]);
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, searchEndpoint]);

  // Global "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Autofocus mobile input when overlay opens
  useEffect(() => {
    if (mobileOpen) {
      requestAnimationFrame(() => mobileInputRef.current?.focus());
    }
  }, [mobileOpen]);

  const navigateToResult = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query);
      setRecentSearches(getRecentSearches());
      setIsOpen(false);
      setMobileOpen(false);
      setQuery('');
      setResults([]);
      router.push(result.href);
    },
    [query, router]
  );

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
    setIsOpen(true);
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const allItems = results;
  const showRecent =
    query.trim().length === 0 && recentSearches.length > 0;

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setMobileOpen(false);
      setQuery('');
      setResults([]);
      inputRef.current?.blur();
      mobileInputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = showRecent ? recentSearches.length - 1 : allItems.length - 1;
      setHighlightedIndex((prev) => (prev < max ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const max = showRecent ? recentSearches.length - 1 : allItems.length - 1;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : max));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showRecent && highlightedIndex >= 0) {
        handleRecentClick(recentSearches[highlightedIndex]);
      } else if (highlightedIndex >= 0 && allItems[highlightedIndex]) {
        navigateToResult(allItems[highlightedIndex]);
      }
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    setRecentSearches(getRecentSearches());
    setHighlightedIndex(-1);
  };

  // --- Shared result list rendering ---

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="p-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-12 w-8 shrink-0 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (showRecent) {
      return (
        <div className="p-2">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Recent searches
            </span>
            <button
              type="button"
              onClick={handleClearRecent}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition"
            >
              Clear
            </button>
          </div>
          {recentSearches.map((term, i) => (
            <button
              key={term}
              type="button"
              onClick={() => handleRecentClick(term)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-left transition',
                i === highlightedIndex
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              )}
            >
              <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{term}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
            </button>
          ))}
        </div>
      );
    }

    if (query.trim().length >= MIN_QUERY_LENGTH && results.length === 0) {
      return (
        <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No results found
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <div className="p-2">
          {results.map((result, i) => (
            <Link
              key={result.id}
              href={result.href}
              onClick={(e) => {
                e.preventDefault();
                navigateToResult(result);
              }}
              className={cn(
                'flex items-center gap-3 rounded-md p-2 transition',
                i === highlightedIndex
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              )}
            >
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt=""
                  className="h-12 w-8 shrink-0 rounded object-cover bg-zinc-100 dark:bg-zinc-800"
                />
              ) : (
                <div className="h-12 w-8 shrink-0 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search className="h-3 w-3 text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                  {result.title}
                </p>
                {result.releaseDate && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {result.releaseDate}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return null;
  };

  const hasDropdownContent =
    isLoading ||
    showRecent ||
    results.length > 0 ||
    (query.trim().length >= MIN_QUERY_LENGTH && results.length === 0);

  return (
    <>
      {/* Desktop search bar */}
      <div ref={containerRef} className="relative hidden md:block w-full">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-9 w-full rounded-full border border-zinc-200/70 bg-white/80 pl-9 pr-8 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/30"
            aria-label="Search"
            role="combobox"
            aria-expanded={isOpen && hasDropdownContent}
            aria-haspopup="listbox"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!query && (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
              /
            </kbd>
          )}
        </div>
        {isOpen && hasDropdownContent && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-lg dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {renderResults()}
            </div>
          </div>
        )}
      </div>

      {/* Mobile search icon + overlay */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center rounded-full border border-zinc-200/70 bg-white/80 p-2 text-zinc-600 shadow-sm transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-200"
          aria-label="Open search"
        >
          <Search className="h-4 w-4" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                aria-label="Search"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setQuery('');
                  setResults([]);
                  setIsOpen(false);
                }}
                className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {renderResults()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
