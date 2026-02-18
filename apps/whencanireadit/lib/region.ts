export type Region = 'GB' | 'US';

export const REGION_COOKIE_NAME = 'preferred_region';

const VALID_REGIONS: Region[] = ['GB', 'US'];

export function isValidRegion(value: string): value is Region {
  return (VALID_REGIONS as string[]).includes(value);
}

export function parseRegionCookie(value: string | null | undefined): Region | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (isValidRegion(upper)) return upper;
  return null;
}
