'use client';

import { ExternalLink } from 'lucide-react';

interface Website {
  category: number;
  url: string;
}

interface GameLinksProps {
  websites?: Website[];
}

// IGDB website category mapping
const WEBSITE_CATEGORIES: Record<number, { name: string; icon?: string }> = {
  1: { name: 'Official Site' },
  2: { name: 'Wikia' },
  3: { name: 'Wikipedia' },
  4: { name: 'Facebook' },
  5: { name: 'Twitter' },
  6: { name: 'Twitch' },
  8: { name: 'Instagram' },
  9: { name: 'YouTube' },
  10: { name: 'iPhone' },
  11: { name: 'iPad' },
  12: { name: 'Android' },
  13: { name: 'Steam' },
  14: { name: 'Reddit' },
  15: { name: 'Itch.io' },
  16: { name: 'Epic Games' },
  17: { name: 'GOG' },
  18: { name: 'Discord' },
};

export function GameLinks({ websites }: GameLinksProps) {
  if (!websites || websites.length === 0) {
    return null;
  }

  // Extract domain name from URL
  const getDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname;
      
      // Remove www. prefix
      hostname = hostname.replace(/^www\./, '');
      
      // Get the main domain name (e.g., "steam" from "store.steampowered.com")
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        // Return the second-to-last part (main domain name)
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
      
      return hostname;
    } catch {
      return 'Website';
    }
  };

  // Get favicon URL using Google's favicon service
  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return '';
    }
  };

  // Filter and sort websites to prioritize news/preview sites
  const priorityCategories = [1, 2, 3, 13, 16, 17]; // Official, wikis, stores
  const sortedWebsites = [...websites].sort((a, b) => {
    const aPriority = priorityCategories.includes(a.category) ? 0 : 1;
    const bPriority = priorityCategories.includes(b.category) ? 0 : 1;
    return aPriority - bPriority;
  });

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        External Links
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {sortedWebsites.map((website, index) => {
          const categoryInfo = WEBSITE_CATEGORIES[website.category];
          const categoryName = categoryInfo?.name || '';
          const domainName = getDomainName(website.url);
          const faviconUrl = getFaviconUrl(website.url);
          
          // Prefer category name for well-known services, otherwise use domain
          const displayName = categoryName || domainName;

          return (
            <a
              key={index}
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950"
            >
              <div className="flex items-center gap-3 min-w-0">
                {faviconUrl && (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="h-4 w-4 flex-shrink-0"
                    onError={(e) => {
                      // Hide icon if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {displayName}
                </span>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-400" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
