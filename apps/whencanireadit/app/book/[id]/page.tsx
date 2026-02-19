import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { getBookById, getBookByISBN, getSimilarBooks } from '@/lib/google-books';
import { generateBuyLinks, getBookshopLink } from '@/lib/buy-links';
import { resolveRegionalIsbn } from '@/lib/open-library';
import { config } from '@/lib/config';
import type { Book } from '@/lib/types';
import { detectRegion } from '@/lib/region';
import type { Region } from '@/lib/region';

import { BookshelfToggle } from '@/components/BookshelfToggle';
import { BuyLinks } from '@/components/BuyLinks';
import { RecordView } from '@/components/RecordView';
import { DetailBackLink } from '@whencani/ui/detail-back-link';
import { DetailHeroCard } from '@whencani/ui/detail-hero-card';
import { MediaCarousel } from '@whencani/ui/media-carousel';
import { ShareButton } from '@whencani/ui';
import { LatestNews } from '@whencani/ui';

const SITE_URL = config.app?.url || 'https://whencanireadit.com';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

function isISBN(str: string): boolean {
  const cleaned = str.replace(/-/g, '');
  return /^(?:\d{10}|\d{13}|\d{9}[\dXx])$/.test(cleaned);
}

function formatPublicationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatLanguageName(lang: string | null): string {
  if (!lang) return 'Unknown';
  try {
    // Use Intl.DisplayNames when available
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames) {
      // @ts-ignore
      const dn = new Intl.DisplayNames(['en'], { type: 'language' });
      return dn.of(lang) ?? lang;
    }
  } catch {
    // ignore
  }
  return lang;
}

function InfoCard({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-100/70 bg-white p-3 text-sm shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">{value}</div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const country = config.features.regionSwitcher ? await detectRegion() : undefined;
  const book = isISBN(id) ? await getBookByISBN(id, country) : await getBookById(id, country);
  if (!book) return {};

  const coverImage = book.coverUrlLarge ?? book.coverUrl ?? undefined;
  const authorLabel = book.authors && book.authors.length > 0 ? ` — ${book.authors.join(', ')}` : '';
  const description = book.description ? book.description.replace(/<[^>]*>/g, '').substring(0, 160) : `Check out ${book.title} on ${SITE_URL}`;

  return {
    title: `${book.title}${authorLabel} | WhenCanIReadIt.com`,
    description,
    alternates: { canonical: `${SITE_URL}/book/${book.id}` },
    openGraph: {
      title: `${book.title}${authorLabel}`,
      description,
      url: `${SITE_URL}/book/${book.id}`,
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

  const region: Region = config.features.regionSwitcher ? await detectRegion() : 'US';

  const book = isISBN(id) ? await getBookByISBN(id, region) : await getBookById(id, region);
  if (!book) {
    notFound();
  }

  const similarBooks = await getSimilarBooks(book.id, region);

  const coverUrl = book.coverUrl ?? null;
  const backdropUrl = book.coverUrlLarge ?? book.coverUrl ?? null;

  const buyLinks = config.features?.buyLinks ? generateBuyLinks(region) : [];
  const originalIsbn = book.isbn13 ?? book.isbn10;
  const bookshopRegion: Region = region;

  // Resolve regional ISBN when the feature is enabled
  let bookshopIsbn = originalIsbn;
  if (originalIsbn && config.features.regionalIsbn) {
    const resolved = await resolveRegionalIsbn(originalIsbn, bookshopRegion, {
      title: book.title,
      authors: book.authors,
    });
    bookshopIsbn = resolved.isbn13 ?? resolved.isbn10 ?? originalIsbn;
  }

  const bookshopLink = bookshopIsbn ? getBookshopLink(bookshopIsbn, bookshopRegion) : null;
  const pageUrl = `${SITE_URL}/book/${book.id}`;
  const isPreorder = book.saleInfo?.saleability === 'FOR_PREORDER';

  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    ...(book.subtitle && { alternativeHeadline: book.subtitle }),
    author: book.authors.map((a) => ({ '@type': 'Person', name: a })),
    ...(book.publisher && { publisher: { '@type': 'Organization', name: book.publisher } }),
    ...(book.publishedDate && { datePublished: book.publishedDate }),
    ...(book.isbn13 && { isbn: book.isbn13 }),
    ...(book.description && { description: book.description.replace(/<[^>]*>/g, '').substring(0, 500) }),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }} />
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
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">{book.title}</h1>
              <div className="flex items-center gap-2">
                <ShareButton title={`${book.title} — WhenCanIReadIt.com`} text={book.publishedDate ? `${book.title} by ${book.authors.join(', ')}. Check it out!` : `Check out ${book.title} on WhenCanIReadIt.com`} url={pageUrl} />
                <BookshelfToggle bookId={book.id} className="shadow" />
              </div>
            </div>
            {book.subtitle && <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-300">{book.subtitle}</p>}
          </div>

          {book.authors.length > 0 && <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">by {book.authors.join(', ')}</p>}

          {book.publishedDate && (
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-lg shadow-sky-500/30">{formatPublicationDate(book.publishedDate)}</span>
              {isPreorder && <span className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 dark:bg-zinc-900/70 dark:text-sky-400">Pre-order</span>}
            </div>
          )}

          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.categories.map((category) => (
                <span key={category} className="rounded-full border border-zinc-200/70 px-3 py-1 text-xs text-zinc-600 transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400">{category}</span>
              ))}
            </div>
          )}

          {book.description ? (
            <details className="group">
              <summary className="cursor-pointer list-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <div className="line-clamp-2 group-open:line-clamp-none" dangerouslySetInnerHTML={{ __html: book.description }} />
                <span className="mt-1 block text-xs font-semibold text-sky-600 group-open:hidden dark:text-sky-400">Show more</span>
                <span className="mt-1 hidden text-xs font-semibold text-sky-600 group-open:block dark:text-sky-400">Show less</span>
              </summary>
            </details>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">Description is not available yet.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {book.publisher && <InfoCard label="Publisher" value={book.publisher} />}
            {book.pageCount && <InfoCard label="Page Count" value={String(book.pageCount)} />}
            {(book.isbn13 ?? book.isbn10) && <InfoCard label="ISBN" value={(book.isbn13 ?? book.isbn10) as string} />}
            {book.language && <InfoCard label="Language" value={formatLanguageName(book.language)} />}
          </div>

          <div className="flex flex-wrap gap-2">
            {bookshopLink && (
              <a
                href={bookshopLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                {bookshopLink.label}
              </a>
            )}
            {buyLinks.length > 0 && <BuyLinks links={buyLinks} isPreorder={isPreorder} />}
          </div>

          <LatestNews productName={book.title} productType="book" extraSearchQuery={book.authors.join(' ')} numberOfArticles={3} />
        </DetailHeroCard>

        {similarBooks.length > 0 && (
          <MediaCarousel label="You might also like" slideBasis="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]" className="mt-8">
            {similarBooks.slice(0, 6).map((similar) => (
              <Link key={similar.id} href={`/book/${similar.id}`} className="block rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-sky-400 dark:border-zinc-800/80 dark:bg-zinc-900/80">
                <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  {similar.coverUrl ? (
                    <Image src={similar.coverUrl} alt={`${similar.title} cover`} fill className="object-cover" sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">No cover</div>
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{similar.title}</p>
                {similar.authors.length > 0 && <p className="mt-0.5 text-xs text-zinc-500">{similar.authors[0]}</p>}
              </Link>
            ))}
          </MediaCarousel>
        )}
      </main>

      <RecordView item={{ id: book.id, title: book.title, imageUrl: coverUrl, href: `/book/${book.id}`, releaseDate: book.publishedDate ? formatPublicationDate(book.publishedDate) : null }} />
    </div>
  );
}
