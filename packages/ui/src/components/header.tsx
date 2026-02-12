import Link from "next/link";
import { Star, CalendarDays } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export interface HeaderProps {
  logoSrc: string;
  logoAlt: string;
  logoHref?: string;
}

export function Header({ logoSrc, logoAlt, logoHref = "/" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={logoHref} className="flex items-center h-8 sm:h-10">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-full w-auto"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/80 px-2 py-1 sm:px-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 shadow-sm transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-200"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </Link>
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/80 px-2 py-1 sm:px-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 shadow-sm transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-200"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Watchlist</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}