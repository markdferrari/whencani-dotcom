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

  return links;
}
