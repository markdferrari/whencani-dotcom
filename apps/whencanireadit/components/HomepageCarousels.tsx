import Image from "next/image";
import Link from "next/link";
import { MediaCarousel } from "@whencani/ui/media-carousel";
import { MediaCard } from "@whencani/ui";
import type { NYTBestsellerList, Book } from "@/lib/types";

interface NYTCarouselProps {
  list: NYTBestsellerList;
}

function NYTBookCard({ book }: { book: NYTBestsellerList["books"][number] }) {
  const href = book.googleBooksId
    ? `/book/${book.googleBooksId}`
    : book.amazonUrl ?? "#";

  return (
    <Link href={href} className="group block">
      <article className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-100/80 bg-white p-4 text-center shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70">
        <div className="relative flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900" style={{ width: 160, height: 240 }}>
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={`${book.title} book cover`}
              width={160}
              height={240}
              className="h-full w-full object-cover"
              priority={false}
              unoptimized={book.coverUrl.startsWith('/api/image')}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">#{book.rank}</p>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-sky-500">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              by {book.author}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export function NYTCarousel({ list }: NYTCarouselProps) {
  const displayName =
    list.displayName === 'Combined Print & E-Book Fiction' ? 'Trending Fiction' :
    list.displayName === 'Combined Print & E-Book Nonfiction' ? 'Trending Nonfiction' :
    list.displayName;
  return (
    <MediaCarousel label={displayName} subtitle={`Updated ${list.publishedDate}`}>
      {list.books.map((book) => (
        <NYTBookCard key={book.isbn13 || book.title} book={book} />
      ))}
    </MediaCarousel>
  );
}

function GoogleBookCard({ book }: { book: Book }) {
  return (
    <MediaCard
      id={book.id}
      href={`/book/${book.id}`}
      title={book.title}
      imageUrl={book.coverUrl || undefined}
      imageAlt={`${book.title} book cover`}
      releaseDate={book.publishedDate ? formatPublishedDate(book.publishedDate) : undefined}
      summary={book.description || undefined}
      authors={book.authors}
      genres={book.categories}
    />
  );
}

function formatPublishedDate(dateStr: string): string {
  // Google Books dates can be "2026", "2026-03", or "2026-03-15"
  const parts = dateStr.split("-");
  if (parts.length === 1) return parts[0]; // Just year
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (parts.length === 2) {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function NYTSidebar({ fictionList, nonfictionList }: { fictionList: NYTBestsellerList | null; nonfictionList: NYTBestsellerList | null }) {
  return (
    <div className="space-y-6">
      {fictionList && fictionList.books.length > 0 && (
        <MediaCarousel label="Trending Fiction" slideBasis="flex-[0_0_100%]">
          {fictionList.books.slice(0, 8).map((book) => (
            <NYTBookCard key={book.isbn13 || book.title} book={book} />
          ))}
        </MediaCarousel>
      )}
      {nonfictionList && nonfictionList.books.length > 0 && (
        <MediaCarousel label="Trending Nonfiction" slideBasis="flex-[0_0_100%]">
          {nonfictionList.books.slice(0, 8).map((book) => (
            <NYTBookCard key={book.isbn13 || book.title} book={book} />
          ))}
        </MediaCarousel>
      )}
    </div>
  );
}

export function BooksCarousel({ label, books }: { label: string; books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
        No books found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
          {label}
        </p>
      </div>
      <div className="space-y-4">
        {books.map((book) => (
          <GoogleBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
