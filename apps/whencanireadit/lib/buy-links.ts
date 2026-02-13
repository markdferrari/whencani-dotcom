import type { Book, BuyLink } from './types';

export function generateBuyLinks(book: Book): BuyLink[] {
  const links: BuyLink[] = [];
  const isbn = book.isbn13 ?? book.isbn10;

  if (isbn) {
    links.push({
      name: 'Amazon',
      url: `https://www.amazon.com/dp/${isbn}`,
      icon: 'amazon',
    });
    links.push({
      name: 'Bookshop.org',
      url: `https://bookshop.org/p/books/${isbn}`,
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
