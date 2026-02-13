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
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-100 shadow-sm transition group-hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-800">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 20vw"
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
      <div className="mt-2 space-y-0.5">
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
  return (
    <MediaCarousel label={list.displayName} subtitle={`Updated ${list.publishedDate}`}>
      {list.books.map((book) => (
        <NYTBookCard key={book.isbn13 || book.title} book={book} />
      ))}
    </MediaCarousel>
  );
}

function GoogleBookCard({ book }: { book: Book }) {
  return (
    <Link href={`/book/${book.id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-100 shadow-sm transition group-hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-800">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-zinc-400">
            {book.title}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-semibold leading-tight text-zinc-900 line-clamp-2 dark:text-zinc-100">
          {book.title}
        </p>
        <p className="text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
          {book.authors.join(", ")}
        </p>
        {book.publishedDate && (
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {book.publishedDate}
          </p>
        )}
      </div>
    </Link>
  );
}

export function BooksCarousel({ label, subtitle, books }: { label: string; subtitle?: string; books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <MediaCarousel label={label} subtitle={subtitle}>
      {books.map((book) => (
        <GoogleBookCard key={book.id} book={book} />
      ))}
    </MediaCarousel>
  );
}
