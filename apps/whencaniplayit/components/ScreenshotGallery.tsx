"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ScreenshotLightbox } from "./ScreenshotLightbox";

interface ScreenshotGalleryProps {
  screenshots: string[];
  title: string;
}

export function ScreenshotGallery({ screenshots, title }: ScreenshotGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = (index: number) => {
    setActiveIndex(index);
  };

  const close = () => setActiveIndex(null);

  const onNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current + 1) % screenshots.length;
    });
  }, [screenshots.length]);

  const onPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current - 1 + screenshots.length) % screenshots.length;
    });
  }, [screenshots.length]);

  return (
    <div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-2">
        {screenshots.map((screenshot, index) => (
          <button
            key={screenshot}
            type="button"
            onClick={() => open(index)}
            className="group relative aspect-video overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-label={`Open screenshot ${index + 1}`}
          >
            <Image
              src={screenshot}
              alt={`${title} screenshot ${index + 1}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 1024px) 45vw, 420px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Click to expand
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 sm:hidden">
        <div
          data-testid="screenshot-gallery-mobile-wrapper"
          className="max-w-full overflow-hidden rounded-2xl"
        >
          <div
            data-testid="screenshot-gallery-mobile-track"
            className="flex gap-4 overflow-x-auto px-4 pb-2"
          >
            {screenshots.map((screenshot, index) => (
              <button
                key={screenshot}
                type="button"
                onClick={() => open(index)}
                className="group relative h-48 min-w-[min(90vw,320px)] flex-none overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                aria-label={`Open screenshot ${index + 1}`}
              >
                <Image
                  src={screenshot}
                  alt={`${title} screenshot ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="min(90vw, 320px)"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Tap to expand
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScreenshotLightbox
        images={screenshots}
        activeIndex={activeIndex}
        onClose={close}
        onNext={onNext}
        onPrev={onPrev}
      />
    </div>
  );
}
