import type { BookReviewArticle } from './types';

const RSS_URL = 'https://rss.nytimes.com/services/xml/rss/nyt/Books/Review.xml';

// In-memory cache: 1 hour TTL
let cache: { articles: BookReviewArticle[]; expires: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

// Patterns that indicate actual book review / recommendation content
const REVIEW_PATTERNS = [
  /^book review:/i,
  /new books? we love/i,
  /best books? of/i,
  /books? that/i,
  /books? to read/i,
  /books? about/i,
  /books? for/i,
  /\breview\b.*\bbook\b/i,
  /what to read/i,
];

// Patterns that indicate non-review content we want to skip
const SKIP_PATTERNS = [
  /^from \d{4}:/i, // Historical obituary reposts like "From 1983:"
];

function isBookReviewArticle(title: string): boolean {
  if (SKIP_PATTERNS.some((p) => p.test(title))) return false;
  return REVIEW_PATTERNS.some((p) => p.test(title));
}

function extractTagContent(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAttribute(xml: string, attr: string): string | null {
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractBookTitles(itemXml: string): string[] {
  const titles: string[] = [];
  const categoryRegex = /<category\s+domain="[^"]*nyt_ttl"[^>]*>([^<]+)<\/category>/gi;
  let match: RegExpExecArray | null;
  while ((match = categoryRegex.exec(itemXml)) !== null) {
    const raw = match[1].replace(/\s*\(Book\)\s*$/i, '').trim();
    if (raw) titles.push(raw);
  }
  return titles;
}

function parseItem(itemXml: string): BookReviewArticle | null {
  const title = extractTagContent(itemXml, 'title');
  const description = extractTagContent(itemXml, 'description');
  const link = extractTagContent(itemXml, 'link');
  const pubDate = extractTagContent(itemXml, 'pubDate');
  const creator = extractTagContent(itemXml, 'dc:creator');

  if (!title || !link || !pubDate) return null;
  if (!isBookReviewArticle(title)) return null;

  // Extract media:content image URL
  const mediaMatch = itemXml.match(/<media:content[^>]*>/i);
  const imageUrl = mediaMatch ? extractAttribute(mediaMatch[0], 'url') : null;

  const bookTitles = extractBookTitles(itemXml);

  return {
    title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
    description: (description ?? '').replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
    url: link.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
    imageUrl,
    author: creator?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? null,
    pubDate,
    bookTitles,
  };
}

export async function getBookReviewArticles(limit = 4): Promise<BookReviewArticle[]> {
  if (cache && cache.expires > Date.now()) {
    return cache.articles.slice(0, limit);
  }

  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[NYT Book Review RSS] ${res.status} ${res.statusText}`);
      return cache?.articles.slice(0, limit) ?? [];
    }

    const xml = await res.text();

    // Split into items
    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null) {
      items.push(match[1]);
    }

    const articles = items
      .map(parseItem)
      .filter((a): a is BookReviewArticle => a !== null);

    cache = { articles, expires: Date.now() + CACHE_TTL };
    return articles.slice(0, limit);
  } catch (err) {
    console.error('[NYT Book Review RSS] Fetch error:', err);
    return cache?.articles.slice(0, limit) ?? [];
  }
}
