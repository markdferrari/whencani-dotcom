import type { Book, BuyLink } from './types';
import { config } from './config';
import { resolveRegionalIsbn } from './open-library';
import type { Region } from './region';

export async function generateBuyLinks(book: Book, countryCode?: string): Promise<BuyLink[]> {
  const links: BuyLink[] = [];
  const cc = countryCode ? countryCode.toUpperCase() : 'US';
  const isGB = cc === 'GB';
  const region: Region = isGB ? 'GB' : 'US';

  const primaryIsbn = book.isbn13 ?? book.isbn10;
  let regionalIsbn = primaryIsbn;

  // Resolve the region-specific ISBN when the feature is enabled
  if (config.features.regionalIsbn && primaryIsbn) {
    const resolved = await resolveRegionalIsbn(primaryIsbn, region);
    regionalIsbn = resolved.isbn13 ?? resolved.isbn10 ?? primaryIsbn;
  }

  const bookshopUkAffiliateTag = '17007';
  const bookshopUsAffiliateTag = '17007TBC';

  if (regionalIsbn && book.title && book.authors && book.authors.length > 0) {
    if (isGB) {
      links.push({
        name: 'Support your local - buy from Bookshop.org',
        url: `https://uk.bookshop.org/a/${bookshopUkAffiliateTag}/${regionalIsbn}`,
        icon: 'bookshop',
      });
    } else {
      links.push({
        name: 'Support your local - buy from Bookshop.org',
        url: `https://bookshop.org/a/${bookshopUsAffiliateTag}/${regionalIsbn}`,
        icon: 'bookshop',
      });
    }
  }

  // Always add Kindle Unlimited (UK vs US)
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
