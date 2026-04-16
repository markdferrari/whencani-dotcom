import type { BuyLink } from './types';
import type { Region } from './region';

export interface BookshopLink {
  url: string;
  label: string;
}

const BOOKSHOP_UK_AFFILIATE_TAG = '17007';
const BOOKSHOP_US_AFFILIATE_TAG = '121353';

export function getBookshopLink(isbn: string, region: Region): BookshopLink {
  const encodedIsbn = encodeURIComponent(isbn);
  if (region === 'GB') {
    return {
      url: `https://uk.bookshop.org/shop/search?keywords=${encodedIsbn}&affiliateid=${BOOKSHOP_UK_AFFILIATE_TAG}`,
      label: 'Buy on Bookshop.org',
    };
  }
  return {
    url: `https://bookshop.org/shop/search?keywords=${encodedIsbn}&affiliateid=${BOOKSHOP_US_AFFILIATE_TAG}`,
    label: 'Buy on Bookshop.org',
  };
}

const AMAZON_AFFILIATE_TAG = 'whencaniplayg-21';

export function generateBuyLinks(countryCode?: string, isbn?: string): BuyLink[] {
  const links: BuyLink[] = [];
  const cc = countryCode ? countryCode.toUpperCase() : 'US';
  const isGB = cc === 'GB';

  // Book-specific Amazon product link (when ISBN is available)
  if (isbn) {
    if (isGB) {
      links.push({
        name: 'Buy on Amazon',
        url: `https://www.amazon.co.uk/dp/${encodeURIComponent(isbn)}?tag=${AMAZON_AFFILIATE_TAG}`,
        icon: 'amazon',
      });
    } else {
      links.push({
        name: 'Buy on Amazon',
        url: `https://www.amazon.com/dp/${encodeURIComponent(isbn)}?tag=${AMAZON_AFFILIATE_TAG}`,
        icon: 'amazon',
      });
    }
  }

  // Kindle Unlimited (UK vs US)
  if (isGB) {
    links.push({
      name: 'Kindle Unlimited',
      url: `https://www.amazon.co.uk/kindle-dbs/hz/signup?tag=${AMAZON_AFFILIATE_TAG}`,
      icon: 'kindle',
    });
  } else {
    links.push({
      name: 'Kindle Unlimited',
      url: `https://www.amazon.com/kindle-dbs/hz/signup?tag=${AMAZON_AFFILIATE_TAG}`,
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
