'use client';

import { useEffect, useState } from 'react';
import { REGION_COOKIE_NAME, parseRegionCookie, type Region } from '@/lib/region';
import { generateBuyLinks, getBookshopLink } from '@/lib/buy-links';
import { BuyLinks } from './BuyLinks';

function readRegionFromCookie(): Region {
  if (typeof document === 'undefined') return 'US';
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REGION_COOKIE_NAME}=`));
  const value = match?.split('=').slice(1).join('=') ?? null;
  return parseRegionCookie(value) ?? 'US';
}

interface RegionBuyLinksProps {
  isPreorder: boolean;
  buyLinksEnabled: boolean;
}

export function RegionBuyLinks({ isPreorder, buyLinksEnabled }: RegionBuyLinksProps) {
  const [region, setRegion] = useState<Region>('US');

  useEffect(() => {
    setRegion(readRegionFromCookie());
  }, []);

  if (!buyLinksEnabled) return null;

  const links = generateBuyLinks(region);
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <BuyLinks links={links} isPreorder={isPreorder} />
    </div>
  );
}

interface RegionBookshopLinkProps {
  isbn: string;
}

export function RegionBookshopLink({ isbn }: RegionBookshopLinkProps) {
  const [region, setRegion] = useState<Region>('US');

  useEffect(() => {
    setRegion(readRegionFromCookie());
  }, []);

  const bookshopLink = getBookshopLink(isbn, region);

  return (
    <a
      href={bookshopLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
    >
      {bookshopLink.label}
    </a>
  );
}
