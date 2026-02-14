import { getAmazonAffiliateUrl, getPlatformFamilyId } from '../amazon';

describe('getAmazonAffiliateUrl', () => {
  it('returns a direct product URL when an Amazon ASIN is available', () => {
    const url = getAmazonAffiliateUrl('Resident Evil 9', [
      { category: 1, uid: '123456' },     // Steam
      { category: 20, uid: 'B0FR45L4H6' }, // Amazon ASIN
    ]);

    expect(url).toBe(
      'https://www.amazon.co.uk/dp/B0FR45L4H6?tag=whencaniplayg-21&linkCode=ll2&ref_=as_li_ss_tl',
    );
  });

  it('returns a search URL when no ASIN is available', () => {
    const url = getAmazonAffiliateUrl('Resident Evil 9', [
      { category: 1, uid: '123456' }, // Steam only
    ]);

    expect(url).toBe(
      'https://www.amazon.co.uk/s?k=Resident%20Evil%209&tag=whencaniplayg-21&linkCode=ll2&ref_=as_li_ss_tl',
    );
  });

  it('returns a search URL when external_games is undefined', () => {
    const url = getAmazonAffiliateUrl('Elden Ring');

    expect(url).toBe(
      'https://www.amazon.co.uk/s?k=Elden%20Ring&tag=whencaniplayg-21&linkCode=ll2&ref_=as_li_ss_tl',
    );
  });

  it('returns a search URL when external_games is empty', () => {
    const url = getAmazonAffiliateUrl('Elden Ring', []);

    expect(url).toBe(
      'https://www.amazon.co.uk/s?k=Elden%20Ring&tag=whencaniplayg-21&linkCode=ll2&ref_=as_li_ss_tl',
    );
  });

  it('encodes special characters in game names', () => {
    const url = getAmazonAffiliateUrl("Tom Clancy's Rainbow Six: Siege");

    expect(url).toContain("k=Tom%20Clancy's%20Rainbow%20Six%3A%20Siege");
    expect(url).toContain('tag=whencaniplayg-21');
  });

  it('always includes the affiliate tag', () => {
    const withAsin = getAmazonAffiliateUrl('Test', [{ category: 20, uid: 'B000TEST' }]);
    const withoutAsin = getAmazonAffiliateUrl('Test');

    expect(withAsin).toContain('tag=whencaniplayg-21');
    expect(withoutAsin).toContain('tag=whencaniplayg-21');
  });
});

describe('getPlatformFamilyId', () => {
  it.each([
    ['PlayStation 5', '1'],
    ['PS4', '1'],
    ['Xbox Series X', '2'],
    ['Nintendo Switch', '5'],
    ['PC (Windows)', '6'],
    ['Linux', '6'],
    ['Mac', '6'],
  ])('maps "%s" to family id "%s"', (name, expected) => {
    expect(getPlatformFamilyId(name)).toBe(expected);
  });

  it('returns null for unknown platforms', () => {
    expect(getPlatformFamilyId('Atari 2600')).toBeNull();
  });
});
