"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

interface AccentClasses {
  navBorderHover: string;
  navTextHover: string;
}

const DEFAULT_ACCENT: AccentClasses = {
  navBorderHover: "hover:border-sky-500",
  navTextHover: "hover:text-sky-500",
};

interface MediaCarouselProps {
  /** Label shown above the carousel (e.g. "Cast", "Similar games") */
  label: string;
  /** Optional subtitle (e.g. "Top billed") */
  subtitle?: string;
  /** Carousel items — each child is rendered as a slide */
  children: React.ReactNode;
  /** CSS class for each slide's flex basis.
   *  Defaults to "flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_20%]" */
  slideBasis?: string;
  className?: string;
  /** Content rendered at the right side of the header (e.g. "Live" badge, "Clear" button) */
  headerRight?: React.ReactNode;
  /** Show prev/next navigation arrows on desktop (hover-reveal). Default: false */
  showNavigation?: boolean;
  /** Tailwind hover classes for nav button accent color */
  accentClasses?: AccentClasses;
  /** Enable scroll-by-wheel on desktop. Default: false */
  wheelScroll?: boolean;
}

export type { MediaCarouselProps };

export function MediaCarousel({
  label,
  subtitle,
  children,
  slideBasis = "flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_20%]",
  className,
  headerRight,
  showNavigation = false,
  accentClasses = DEFAULT_ACCENT,
  wheelScroll = false,
}: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollButtons = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    const raf = window.requestAnimationFrame(() => updateScrollButtons());
    emblaApi.on("select", updateScrollButtons);
    emblaApi.on("reInit", updateScrollButtons);
    return () => {
      window.cancelAnimationFrame(raf);
      emblaApi.off("select", updateScrollButtons);
      emblaApi.off("reInit", updateScrollButtons);
    };
  }, [emblaApi, updateScrollButtons]);

  React.useEffect(() => {
    if (!emblaApi || !wheelScroll) return;
    const container = emblaApi.rootNode();
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) emblaApi.scrollNext();
      else emblaApi.scrollPrev();
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [emblaApi, wheelScroll]);

  const slides = React.Children.toArray(children);

  const scrollPrev = React.useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    emblaApi.scrollTo(Math.max(0, idx - 1));
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    emblaApi.scrollTo(idx + 1);
  }, [emblaApi]);

  return (
    <section
      className={cn(
        "rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 sm:p-10",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            {label}
          </p>
          {subtitle && (
            <p className="text-sm text-zinc-500">{subtitle}</p>
          )}
        </div>
        {headerRight}
      </div>

      <div className={cn("mt-6", showNavigation && "relative group")}>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={cn("min-w-0", slideBasis)}
              >
                {slide}
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <>
            <button
              type="button"
              aria-label="Scroll left"
              disabled={!canScrollPrev}
              onClick={scrollPrev}
              className={cn(
                "hidden lg:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100",
                accentClasses.navBorderHover,
                accentClasses.navTextHover,
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Scroll right"
              disabled={!canScrollNext}
              onClick={scrollNext}
              className={cn(
                "hidden lg:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100",
                accentClasses.navBorderHover,
                accentClasses.navTextHover,
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
