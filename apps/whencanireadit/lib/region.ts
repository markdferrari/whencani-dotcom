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

/**
 * Detect the user's region from cookie preference or IP-based geolocation headers.
 * Must be called from a Server Component or Route Handler (uses next/headers).
 */
export async function detectRegion(): Promise<Region> {
  const { cookies, headers } = await import('next/headers');
  const cookieStore = await cookies();
  const hdrs = await headers();

  const cookieRegion = parseRegionCookie(cookieStore.get(REGION_COOKIE_NAME)?.value);
  if (cookieRegion) return cookieRegion;

  const cc = hdrs.get('cf-ipcountry') ?? hdrs.get('x-vercel-ip-country') ?? 'US';
  return cc.toUpperCase() === 'GB' ? 'GB' : 'US';
}
