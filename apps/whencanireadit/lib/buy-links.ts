import type { Book, BuyLink } from './types';

export function generateBuyLinks(book: Book): BuyLink[] {
  const links: BuyLink[] = [];
  const isbn = book.isbn13 ?? book.isbn10;
  const bookshopUkAffiliateTag = '17007';
  if (isbn) {
    links.push({
      name: 'Support your local - buy from Bookshop.org',
      url: `https://uk.bookshop.org/a/${bookshopUkAffiliateTag}/${isbn}`,
      icon: 'bookshop',
    });
  }

  // Always add Kindle Unlimited link
  links.push({
    name: 'Kindle Unlimited',
    url: 'https://www.amazon.co.uk/kindle-dbs/hz/signup?tag=whencaniplayg-21',
    icon: 'kindle',
  });

  // Always add Audible link
  links.push({
    name: 'Try Audible',
    url: 'https://amzn.to/4cr3qHQ',
    icon: 'audible',
  });

  return links;
}
