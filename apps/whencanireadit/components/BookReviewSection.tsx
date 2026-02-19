import Image from 'next/image';
import type { BookReviewArticle } from '@/lib/types';

function formatRelativeDate(pubDate: string): string {
  try {
    const date = new Date(pubDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function BookReviewSection({ articles }: { articles: BookReviewArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
          From the NYT Book Review
        </p>
        <a
          href="https://www.nytimes.com/section/books/review"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 transition hover:text-sky-500"
        >
          View all
        </a>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <a
            key={article.url}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 rounded-xl border border-zinc-100/70 bg-white p-3 transition hover:border-sky-400 dark:border-zinc-800/80 dark:bg-zinc-900/80"
          >
            {article.imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-zinc-900 transition group-hover:text-sky-600 dark:text-zinc-50">
                {article.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {article.description}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] text-zinc-400">
                {article.author && <span>{article.author}</span>}
                {article.author && <span>&middot;</span>}
                <span>{formatRelativeDate(article.pubDate)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
