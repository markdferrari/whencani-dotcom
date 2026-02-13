import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getBookById, getSimilarBooks } from '@/lib/google-books';
import { generateBuyLinks } from '@/lib/buy-links';
import { config } from '@/lib/config';
import { BookshelfToggle } from '@/components/BookshelfToggle';
import { BuyLinks } from '@/components/BuyLinks';
import { RecordView } from '@/components/RecordView';
import { DetailBackLink } from '@whencani/ui/detail-back-link';
import { DetailHeroCard } from '@whencani/ui/detail-hero-card';
import { MediaCarousel } from '@whencani/ui/media-carousel';
import { ShareButton } from '@whencani/ui';

const SITE_URL = config.app.url;

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatPublicationDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 1) return parts[0];
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (parts.length === 2) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatLanguageName(code: string): string {
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
    return name ?? code;
  } catch {
    return code;
  }
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id).catch(() => null);

  if (!book) {
    return {};
  }

  const authorLabel = book.authors.length > 0 ? ` by ${book.authors.join(', ')}` : '';
  const description = book.description
    ? book.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Check out ${book.title}${authorLabel} on WhenCanIReadIt.com`;
  const coverImage = book.coverUrlLarge ?? book.coverUrl ?? undefined;

  return {
    title: `${book.title}${authorLabel} | WhenCanIReadIt.com`,
    description,
    alternates: {
      canonical: `${SITE_URL}/book/${id}`,
    },
    openGraph: {
      title: `${book.title}${authorLabel}`,
      description,
      url: `${SITE_URL}/book/${id}`,
      type: 'book',
      images: coverImage ? [{ url: coverImage, alt: book.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title}${authorLabel}`,
      description,
      images: coverImage ? [coverImage] : [],
    },
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [book, similarBooks] = await Promise.all([
    getBookById(id),
    getSimilarBooks(id),
  ]);

  if (!book) {
    notFound();
  }

  const coverUrl = book.coverUrl;
  const backdropUrl = book.coverUrlLarge ?? book.coverUrl;
  const buyLinks = config.features.buyLinks ? generateBuyLinks(book) : [];
  const pageUrl = `${SITE_URL}/book/${id}`;
  const isPreorder = book.saleInfo?.saleability === 'FOR_PREORDER';

  // Schema.org structured data
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    ...(book.subtitle && { alternativeHeadline: book.subtitle }),
    author: book.authors.map((a) => ({ '@type': 'Person', name: a })),
    ...(book.publisher && {
      publisher: { '@type': 'Organization', name: book.publisher },
    }),
    ...(book.publishedDate && { datePublished: book.publishedDate }),
    ...(book.isbn13 && { isbn: book.isbn13 }),
    ...(book.description && {
      description: book.description.replace(/<[^>]*>/g, '').substring(0, 500),
    }),
    ...(book.pageCount && { numberOfPages: book.pageCount }),
    ...(book.language && { inLanguage: book.language }),
    ...(book.coverUrlLarge && { image: book.coverUrlLarge }),
    url: pageUrl,
    ...(book.averageRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: book.averageRating,
        bestRating: 5,
        worstRating: 0,
        ...(book.ratingsCount && { ratingCount: book.ratingsCount }),
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl">
        <DetailBackLink href="/" />

        <DetailHeroCard
          title={book.title}
          backdropUrl={backdropUrl}
          posterUrl={coverUrl}
          posterAlt={`${book.title} book cover`}
          posterAspect="2/3"
          backdropClassName="blur-sm scale-110"
          className="mt-6"
        >
          {/* Title + Bookshelf + Share */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {book.title}
              </h1>
              <div className="flex items-center gap-2">
                <ShareButton
                  title={`${book.title} — WhenCanIReadIt.com`}
                  text={
                    book.publishedDate
                      ? `${book.title} by ${book.authors.join(', ')}. Check it out!`
                      : `Check out ${book.title} on WhenCanIReadIt.com`
                  }
                  url={pageUrl}
                />
                <BookshelfToggle bookId={book.id} className="shadow" />
              </div>
            </div>
            {book.subtitle && (
              <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-300">
                {book.subtitle}
              </p>
            )}
          </div>

          {/* Author(s) */}
          {book.authors.length > 0 && (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              by {book.authors.join(', ')}
            </p>
          )}

          {/* Publication date badge */}
          {book.publishedDate && (
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-sky-500/30">
                {formatPublicationDate(book.publishedDate)}
              </span>
              {isPreorder && (
                <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:bg-zinc-900/70 dark:text-sky-400">
                  Pre-order
                </span>
              )}
            </div>
          )}

          {/* Genre/category pills */}
          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Collapsible description */}
          {book.description ? (
            <details className="group">
              <summary className="cursor-pointer list-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <div
                  className="line-clamp-2 group-open:line-clamp-none"
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
                <span className="mt-1 block text-xs font-semibold text-sky-600 group-open:hidden dark:text-sky-400">
                  Show more
                </span>
                <span className="mt-1 hidden text-xs font-semibold text-sky-600 group-open:block dark:text-sky-400">
                  Show less
                </span>
              </summary>
            </details>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              Description is not available yet.
            </p>
          )}

          {/* Info cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {book.publisher && (
              <InfoCard label="Publisher" value={book.publisher} />
            )}
            {book.pageCount && (
              <InfoCard label="Page Count" value={String(book.pageCount)} />
            )}
            {(book.isbn13 ?? book.isbn10) && (
              <InfoCard label="ISBN" value={(book.isbn13 ?? book.isbn10)!} />
            )}
            {book.language && (
              <InfoCard label="Language" value={formatLanguageName(book.language)} />
            )}
          </div>

          {/* Buy / Pre-order links */}
          {buyLinks.length > 0 && (
            <BuyLinks links={buyLinks} isPreorder={isPreorder} />
          )}
        </DetailHeroCard>

        {/* Similar books carousel */}
        {similarBooks.length > 0 && (
          <MediaCarousel
            label="You might also like"
            slideBasis="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]"
            className="mt-8"
          >
            {similarBooks.slice(0, 6).map((similar) => (
              <Link
                key={similar.id}
                href={`/book/${similar.id}`}
                className="block rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-sky-400 dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  {similar.coverUrl ? (
                    <Image
                      src={similar.coverUrl}
                      alt={`${similar.title} cover`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                      No cover
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {similar.title}
                </p>
                {similar.authors.length > 0 && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {similar.authors[0]}
                  </p>
                )}
              </Link>
            ))}
          </MediaCarousel>
        )}
      </main>
      <RecordView
        item={{
          id,
          title: book.title,
          imageUrl: coverUrl,
          href: `/book/${id}`,
          releaseDate: book.publishedDate ? formatPublicationDate(book.publishedDate) : null,
        }}
      />
    </div>
  );
}
