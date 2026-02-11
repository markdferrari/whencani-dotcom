"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "../utils/cn";

/* ---------- Lightbox ---------- */

interface LightboxProps {
  images: string[];
  activeIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function ScreenshotLightbox({
  images,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
    },
    [activeIndex, onClose, onNext, onPrev],
  );

  React.useEffect(() => {
    if (activeIndex === null) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, handleKeyDown]);

  if (activeIndex === null) return null;

  const image = images[activeIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot preview"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`Screenshot ${activeIndex + 1}`}
          className="h-auto w-full rounded-2xl object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-zinc-900"
          aria-label="Close preview"
        >
          Close
        </button>
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              className="pointer-events-auto ml-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900"
              aria-label="Previous screenshot"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={onNext}
              className="pointer-events-auto mr-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900"
              aria-label="Next screenshot"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Carousel ---------- */

interface ScreenshotCarouselProps {
  /** Array of screenshot URLs */
  screenshots: string[];
  /** Title used for alt text */
  title: string;
  /** Whether images are proxied / unoptimized */
  unoptimized?: boolean;
  className?: string;
}

export function ScreenshotCarousel({
  screenshots,
  title,
  unoptimized = false,
  className,
}: ScreenshotCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const open = (index: number) => setActiveIndex(index);
  const close = () => setActiveIndex(null);

  const onNext = React.useCallback(() => {
    setActiveIndex((c) => (c === null ? null : (c + 1) % screenshots.length));
  }, [screenshots.length]);

  const onPrev = React.useCallback(() => {
    setActiveIndex((c) =>
      c === null ? null : (c - 1 + screenshots.length) % screenshots.length,
    );
  }, [screenshots.length]);

  if (screenshots.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:p-10",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
        Screenshots
      </p>

      <div className="mt-4 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {screenshots.map((screenshot, index) => (
            <button
              key={screenshot}
              type="button"
              onClick={() => open(index)}
              className="group relative min-w-0 flex-[0_0_85%] overflow-hidden rounded-2xl sm:flex-[0_0_60%] lg:flex-[0_0_45%]"
              aria-label={`Open screenshot ${index + 1}`}
            >
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={screenshot}
                  alt={`${title} screenshot ${index + 1}`}
                  fill
                  unoptimized={unoptimized}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 60vw, 45vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Tap to expand
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ScreenshotLightbox
        images={screenshots}
        activeIndex={activeIndex}
        onClose={close}
        onNext={onNext}
        onPrev={onPrev}
      />
    </section>
  );
}
