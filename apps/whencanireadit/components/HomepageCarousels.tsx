import Image from "next/image";
import Link from "next/link";
import { MediaCarousel } from "@whencani/ui/media-carousel";
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
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-100 shadow-sm transition group-hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-800">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="260px"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-400">
            {book.title}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
            #{book.rank}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-semibold leading-tight text-zinc-900 line-clamp-2 dark:text-zinc-100">
          {book.title}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
          {book.author}
        </p>
        {book.weeksOnList > 1 && (
          <p className="text-[10px] font-medium text-sky-600 dark:text-sky-400">
            {book.weeksOnList} weeks on list
          </p>
        )}
      </div>
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
    <Link href={`/book/${book.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-100 shadow-sm transition group-hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-800">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
            <span className="line-clamp-3">{book.title}</span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-semibold leading-tight text-zinc-900 line-clamp-2 dark:text-zinc-100">
          {book.title}
        </p>
        {book.authors.length > 0 && (
          <p className="text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
            {book.authors.join(", ")}
          </p>
        )}
        {book.publishedDate && (
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {formatPublishedDate(book.publishedDate)}
          </p>
        )}
      </div>
    </Link>
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

export function BooksCarousel({ label, subtitle, books }: { label: string; subtitle?: string; books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <MediaCarousel label={label} slideBasis="flex-[0_0_100%]">
      {books.map((book) => (
        <GoogleBookCard key={book.id} book={book} />
      ))}
    </MediaCarousel>
  );
}
