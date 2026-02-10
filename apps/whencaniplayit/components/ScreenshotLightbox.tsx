"use client";

import { useCallback, useEffect } from "react";

interface ScreenshotLightboxProps {
  images: string[];
  activeIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ScreenshotLightbox({
  images,
  activeIndex,
  onClose,
  onNext,
  onPrev,
}: ScreenshotLightboxProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (activeIndex === null) return;

      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        onNext();
      }

      if (event.key === "ArrowLeft") {
        onPrev();
      }
    },
    [activeIndex, onClose, onNext, onPrev],
  );

  useEffect(() => {
    if (activeIndex === null) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, handleKeyDown]);

  if (activeIndex === null) {
    return null;
  }

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
        onClick={(event) => event.stopPropagation()}
      >
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
