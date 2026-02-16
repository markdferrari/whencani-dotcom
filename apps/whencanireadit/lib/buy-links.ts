import type { Book, BuyLink } from './types';

export function generateBuyLinks(book: Book, countryCode?: string): BuyLink[] {
  const links: BuyLink[] = [];
  const isbn = book.isbn13 ?? book.isbn10;
  const bookshopUkAffiliateTag = '17007';
  const bookshopUsAffiliateTag = '17007TBC';

  if (isbn && book.title && book.authors && book.authors.length > 0) {
    if (countryCode === 'GB') {
      links.push({
        name: 'Support your local - buy from Bookshop.org',
        url: `https://uk.bookshop.org/a/${bookshopUkAffiliateTag}/${isbn}`,
        icon: 'bookshop',
      });
    }// else {
     // links.push({
     //   name: 'Support your local - buy from Bookshop.org',
     //   url: `https://bookshop.org/a/${bookshopUsAffiliateTag}/${isbn}`,
     //   icon: 'bookshop',
     // });
    //}
  }

  // Always add Kindle Unlimited 
  if (countryCode === 'GB') {
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
  })};

  // Always add Audible link
  links.push({
    name: 'Try Audible',
    url: 'https://amzn.to/4cr3qHQ',
    icon: 'audible',
  });

  return links;
}
