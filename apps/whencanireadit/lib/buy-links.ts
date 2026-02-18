import type { BuyLink } from './types';
import type { Region } from './region';

export interface BookshopLink {
  url: string;
  label: string;
}

const BOOKSHOP_UK_AFFILIATE_TAG = '17007';
const BOOKSHOP_US_AFFILIATE_TAG = '17007TBC';

export function getBookshopLink(isbn: string, region: Region): BookshopLink {
  if (region === 'GB') {
    return {
      url: `https://uk.bookshop.org/a/${BOOKSHOP_UK_AFFILIATE_TAG}/${isbn}`,
      label: 'Buy on Bookshop.org',
    };
  }
  return {
    url: `https://bookshop.org/a/${BOOKSHOP_US_AFFILIATE_TAG}/${isbn}`,
    label: 'Buy on Bookshop.org',
  };
}

export function generateBuyLinks(countryCode?: string): BuyLink[] {
  const links: BuyLink[] = [];
  const cc = countryCode ? countryCode.toUpperCase() : 'US';
  const isGB = cc === 'GB';

  // Kindle Unlimited (UK vs US)
  if (isGB) {
    links.push({
      name: 'Kindle Unlimited',
      url: 'https://www.amazon.co.uk/kindle-dbs/hz/signup?tag=whencaniplayg-21',
      icon: 'kindle',
    });
  } else {
    links.push({
      name: 'Kindle Unlimited',
      url: 'https://www.amazon.com/kindle-dbs/hz/signup?tag=whencaniplayg-21',
      icon: 'kindle',
    });
  }

  // Always add Audible link
  links.push({
    name: 'Try Audible',
    url: 'https://amzn.to/4cr3qHQ',
    icon: 'audible',
  });

  return links;
}
