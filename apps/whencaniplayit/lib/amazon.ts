/**
 * Amazon affiliate link utilities.
 *
 * Generates per-game Amazon links using the ASIN from IGDB's
 * external_games data (category 20) when available, falling back
 * to an Amazon search URL with the game name.
 */

import { config } from './config';

const AMAZON_ASIN_CATEGORY = 20;

interface ExternalGame {
  category: number;
  uid: string;
}

function getAmazonAsin(externalGames?: ExternalGame[]): string | null {
  if (!externalGames) return null;
  const entry = externalGames.find((eg) => eg.category === AMAZON_ASIN_CATEGORY);
  return entry?.uid ?? null;
}

function buildProductUrl(asin: string): string {
  const { domain, tag } = config.amazon;
  return `https://www.${domain}/dp/${asin}?tag=${tag}&linkCode=ll2&ref_=as_li_ss_tl`;
}

function buildSearchUrl(gameName: string): string {
  const { domain, tag } = config.amazon;
  return `https://www.${domain}/s?k=${encodeURIComponent(gameName)}+game&tag=${tag}&linkCode=ll2&ref_=as_li_ss_tl`;
}

/**
 * Get the best Amazon affiliate URL for a game.
 * Returns a direct product link when an ASIN is available,
 * otherwise falls back to a search URL.
 */
export function getAmazonAffiliateUrl(
  gameName: string,
  externalGames?: ExternalGame[],
): string {
  const asin = getAmazonAsin(externalGames);
  return asin ? buildProductUrl(asin) : buildSearchUrl(gameName);
}

/**
 * Generate an Amazon search URL tailored for board games (no ASIN available from BGG)
 */
export function getAmazonBoardGameUrl(gameName: string): string {
  const { domain, tag } = config.amazon;
  const query = `${gameName} board game`;
  return `https://www.${domain}/s?k=${encodeURIComponent(query)}&tag=${tag}&linkCode=ll2&ref_=as_li_ss_tl`;
}

/**
 * Map a platform name to its broad platform family ID.
 * Used by the game detail page for platform pill links.
 */
export function getPlatformFamilyId(platformName: string): string | null {
  const name = platformName.toLowerCase();
  if (name.includes('playstation') || name.includes('ps')) return '1';
  if (name.includes('xbox')) return '2';
  if (name.includes('nintendo') || name.includes('switch')) return '5';
  if (name.includes('pc') || name.includes('windows') || name.includes('linux') || name.includes('mac')) return '6';
  return null;
}
