'use client';

import { useState, useEffect } from 'react';
import { generateBuyLinks, getBookshopLink } from '@/lib/buy-links';
import { BuyLinks } from '@/components/BuyLinks';
import type { Region } from '@/lib/region';

function readRegionFromCookie(): Region {
  if (typeof document === 'undefined') return 'US';
  const match = document.cookie.match(/(?:^|;\s*)preferred_region=(\w+)/);
  const val = match?.[1]?.toUpperCase();
  return val === 'GB' ? 'GB' : 'US';
}

interface RegionBuyLinksProps {
  isPreorder?: boolean;
  className?: string;
}

export function RegionBuyLinks({ isPreorder, className }: RegionBuyLinksProps) {
  const [region, setRegion] = useState<Region>('US');
  useEffect(() => setRegion(readRegionFromCookie()), []);

  const links = generateBuyLinks(region);
  if (links.length === 0) return null;

  return (
    <div className={className}>
      <BuyLinks links={links} isPreorder={isPreorder} />
    </div>
  );
}

interface RegionBookshopLinkProps {
  isbn: string;
}

export function RegionBookshopLink({ isbn }: RegionBookshopLinkProps) {
  const [region, setRegion] = useState<Region>('US');
  useEffect(() => setRegion(readRegionFromCookie()), []);

  const link = getBookshopLink(isbn, region);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
    >
      {link.label}
    </a>
  );
}
