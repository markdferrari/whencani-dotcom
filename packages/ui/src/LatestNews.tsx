import Parser from 'rss-parser';
import { MediaCarousel } from './components/media-carousel';

export interface LatestNewsProps {
  productName: string;
  productType: 'game' | 'book' | 'movie' | 'tv' | 'boardgame';
  extraSearchQuery?: string;
  numberOfArticles?: number;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
}

export async function LatestNews({ productName, productType, extraSearchQuery = '', numberOfArticles = 6 }: LatestNewsProps) {
  try {
    const parser = new Parser();
    let category = '';
    switch (productType) {
      case 'game':
        category = 'video game';
        break;
      case 'book':
        category = 'book';
        break;
      case 'movie':
        category = 'movie';
        break;
      case 'tv':
        category = 'tv show';
        break;
      case 'boardgame':
        category = 'board game';
        break;  
      case 'movie':
        category = 'movie';
        break;
      case 'tv':
        category = 'tv show';
        break;        
      default:
        category = '';
    }
    const query = category ? `${productName} ${category} ${extraSearchQuery}` : `${productName} ${extraSearchQuery}`;
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      return null;
    }

    // Take up to the specified number of articles
    const newsItems = feed.items.slice(0, numberOfArticles) as NewsItem[];

    return (
      <div className="mt-4">
        <MediaCarousel
          label="Latest News"
          slideBasis="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]"
          showNavigation={true}
          className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40"
        >
          {newsItems.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full rounded-lg border border-zinc-200 bg-white p-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950"
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2">
                {item.title}
              </div>
              {item.contentSnippet && (
                <div className="text-zinc-600 dark:text-zinc-400 line-clamp-3 text-xs mb-2">
                  {item.contentSnippet}
                </div>
              )}
              {item.pubDate && (
                <div className="text-zinc-500 dark:text-zinc-500 text-xs">
                  {new Date(item.pubDate).toLocaleDateString()}
                </div>
              )}
            </a>
          ))}
        </MediaCarousel>
      </div>
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return null;
  }
}
