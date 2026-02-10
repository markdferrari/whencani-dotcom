'use client';

import type { OpenCriticReview } from '@/lib/opencritic';
import { EmblaCarouselReviews } from './EmblaCarouselReviews';
import { Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FetchState = 'idle' | 'loading' | 'loaded' | 'error';

const LATEST_REVIEWS_ENDPOINT = '/api/opencritic/reviewed-this-week';

export function LatestReviewsSection() {
  const [reviews, setReviews] = useState<OpenCriticReview[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const hasFetched = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  const loadReviews = async () => {
    setState('loading');

    try {
      const response = await fetch(LATEST_REVIEWS_ENDPOINT, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch latest reviews: ${response.status}`);
      }

      const data = (await response.json()) as { reviews?: OpenCriticReview[] };
      const nextReviews = Array.isArray(data.reviews) ? data.reviews : [];

      setReviews(nextReviews);
      setState('loaded');
    } catch (error) {
      console.error('Failed to fetch latest reviews:', error);
      setReviews([]);
      setState('error');
    }
  };

  useEffect(() => {
    if (!sectionRef.current || hasFetched.current) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      hasFetched.current = true;
      void loadReviews();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !hasFetched.current) {
          hasFetched.current = true;
          void loadReviews();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <aside ref={sectionRef} className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Trophy className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Latest Reviews
        </h2>
      </div>

      <div data-testid="latest-reviews-carousel-wrapper" className="flex-1 overflow-hidden max-w-full min-w-0">
        {state === 'idle' || state === 'loading' ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80">
            <div>
              <Trophy className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading latest reviews…
              </p>
            </div>
          </div>
        ) : reviews.length > 0 ? (
          <EmblaCarouselReviews reviews={reviews} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 p-6 text-center dark:border-zinc-800/70 dark:bg-zinc-900/80">
            <div>
              <Trophy className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No reviews available
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
