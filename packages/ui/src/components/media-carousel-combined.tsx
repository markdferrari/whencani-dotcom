"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "../utils/cn";

interface CombinedMediaCarouselProps {
  trailerEmbedUrl?: string | null;
  screenshots: string[];
  title: string;
  unoptimized?: boolean;
  className?: string;
  slideBasis?: string;
}

function Lightbox({
  images,
  trailerEmbedUrl,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: {
  images: string[];
  trailerEmbedUrl?: string | null;
  activeIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
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

  const hasTrailer = Boolean(trailerEmbedUrl);
  const isTrailerSlide = hasTrailer && activeIndex === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
      onClick={onClose}
    >
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {isTrailerSlide ? (
          <div className="aspect-video w-full">
            <iframe
              src={trailerEmbedUrl || undefined}
              title="Trailer preview"
              className="h-full w-full rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[hasTrailer ? activeIndex - 1 : activeIndex]}
            alt={`Screenshot ${activeIndex + 1}`}
            className="h-auto w-full rounded-2xl object-contain"
          />
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-zinc-900"
          aria-label="Close preview"
        >
          Close
        </button>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="pointer-events-auto ml-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900"
            aria-label="Previous media"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="pointer-events-auto mr-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900"
            aria-label="Next media"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaCarouselCombined({
  trailerEmbedUrl,
  screenshots,
  title,
  unoptimized = false,
  className,
  slideBasis = "flex-[0_0_85%] sm:flex-[0_0_60%] lg:flex-[0_0_45%]",
}: CombinedMediaCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const open = (index: number) => setActiveIndex(index);
  const close = () => setActiveIndex(null);

  const totalSlides = (trailerEmbedUrl ? 1 : 0) + screenshots.length;

  const onNext = React.useCallback(() => {
    setActiveIndex((c) => (c === null ? null : (c + 1) % totalSlides));
  }, [totalSlides]);

  const onPrev = React.useCallback(() => {
    setActiveIndex((c) => (c === null ? null : (c - 1 + totalSlides) % totalSlides));
  }, [totalSlides]);

  if (!trailerEmbedUrl && screenshots.length === 0) return null;

  // derive youtube thumbnail if trailer present
  const trailerIdMatch = trailerEmbedUrl ? trailerEmbedUrl.match(/embed\/([^?&]+)/) : null;
  const trailerThumb = trailerIdMatch ? `https://img.youtube.com/vi/${trailerIdMatch[1]}/hqdefault.jpg` : null;

  const slides: React.ReactNode[] = [];
  if (trailerEmbedUrl) {
    slides.push(
      <button
        key="trailer"
        type="button"
        onClick={() => open(0)}
        className={cn("group relative min-w-0 overflow-hidden rounded-2xl", slideBasis)}
        aria-label="Open trailer"
      >
        <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900">
          {trailerThumb ? (
            <Image
              src={trailerThumb}
              alt={`${title} trailer`}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">Trailer</div>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/90 p-3 text-zinc-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" className="fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </button>,
    );
  }

  screenshots.forEach((screenshot, index) => {
    const slideIndex = (trailerEmbedUrl ? 1 : 0) + index;
    slides.push(
      <button
        key={screenshot}
        type="button"
        onClick={() => open(slideIndex)}
        className={cn("group relative min-w-0 overflow-hidden rounded-2xl", slideBasis)}
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
      </button>,
    );
  });

  return (
    <section
      className={cn(
        "rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:p-10",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">Media</p>

      <div className="mt-4 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">{slides}</div>
      </div>

      <Lightbox
        images={screenshots}
        trailerEmbedUrl={trailerEmbedUrl}
        activeIndex={activeIndex}
        onClose={close}
        onNext={onNext}
        onPrev={onPrev}
      />
    </section>
  );
}

export default MediaCarouselCombined;
