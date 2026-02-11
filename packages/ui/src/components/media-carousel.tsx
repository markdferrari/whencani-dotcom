"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "../utils/cn";

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
}

export function MediaCarousel({
  label,
  subtitle,
  children,
  slideBasis = "flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_20%]",
  className,
}: MediaCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  const slides = React.Children.toArray(children);

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
      </div>

      <div className="mt-6 overflow-hidden" ref={emblaRef}>
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
    </section>
  );
}
