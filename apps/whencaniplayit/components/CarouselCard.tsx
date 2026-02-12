'use client';

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

const getTierColor = (tier?: string) => {
  switch (tier) {
    case 'Mighty':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200';
    case 'Strong':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200';
    case 'Fair':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200';
    case 'Weak':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200';
  }
};

interface CarouselCardProps {
  href: string;
  isExternal?: boolean;
  imageUrl?: string;
  name: string;
  tier?: string;
  platformLabel?: string;
  releaseDate?: string;
  score?: number;
  percentRecommended?: number;
  alt?: string;
}

export function CarouselCard({
  href,
  isExternal,
  imageUrl,
  name,
  tier,
  platformLabel,
  releaseDate,
  score,
  percentRecommended,
  alt,
}: CarouselCardProps) {
  return (
    <Link
      href={href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : undefined)}
      className="group block min-w-0 flex-shrink w-full max-w-full"
    >
      <div className="flex min-w-[220px] items-stretch gap-3 rounded-lg border border-zinc-200/70 bg-white/80 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-900/80">
        <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt ?? `${name} cover`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
              <Star className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {tier && (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${getTierColor(tier)}`}>
                  {tier}
                </span>
              )}
              {platformLabel && (
                <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                  {platformLabel}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-100">
              {name}
            </h3>
          </div>

          <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
            {releaseDate && (
              <span>
                {new Date(releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            {score !== undefined && (
              <span className="flex items-center gap-1.5 text-base text-zinc-900 dark:text-zinc-100">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {score}
                </span>
              </span>
            )}
          </div>

          {percentRecommended !== undefined && (
            <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-6 group-hover:opacity-100">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {Math.round(percentRecommended)}% recommend
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
