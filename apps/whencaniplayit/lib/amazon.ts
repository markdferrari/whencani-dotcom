/**
 * Amazon affiliate link utilities.
 *
 * Maps broad platform "families" (PlayStation, Xbox, PC, Nintendo) to
 * shortened affiliate URLs. The priority array controls which link is
 * chosen when a game spans multiple platform families.
 */

const AMAZON_AFFILIATE_LINKS: Record<string, string> = {
  '1': 'https://amzn.to/4kyuwz3', // PlayStation
  '2': 'https://amzn.to/3MJZ83X', // Xbox
  '6': 'https://amzn.to/3MmJont', // PC
  '5': 'https://amzn.to/4ay9CLA', // Nintendo
};

const AMAZON_AFFILIATE_PRIORITY = ['1', '2', '6', '5'];

/**
 * Map a platform name (e.g. "PlayStation 5", "Xbox Series X") to the
 * broad platform family ID used in `AMAZON_AFFILIATE_LINKS`.
 */
export function getPlatformFamilyId(platformName: string): string | null {
  const name = platformName.toLowerCase();
  if (name.includes('playstation') || name.includes('ps')) return '1';
  if (name.includes('xbox')) return '2';
  if (name.includes('nintendo') || name.includes('switch')) return '5';
  if (name.includes('pc') || name.includes('windows') || name.includes('linux') || name.includes('mac')) return '6';
  return null;
}

/**
 * Given a list of platform names, return the best Amazon affiliate URL
 * (or `null` if none match).
 */
export function getAmazonAffiliateUrl(platformNames: string[]): string | null {
  const familyIds = new Set(
    platformNames.map(getPlatformFamilyId).filter((id): id is string => id !== null),
  );

  const matchedId = AMAZON_AFFILIATE_PRIORITY.find((id) => familyIds.has(id));
  return matchedId ? AMAZON_AFFILIATE_LINKS[matchedId] : null;
}
