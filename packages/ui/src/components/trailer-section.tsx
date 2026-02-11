import * as React from "react";
import { cn } from "../utils/cn";

interface TrailerSectionProps {
  /** Full YouTube embed URL (e.g. https://www.youtube.com/embed/xyz?rel=0) */
  embedUrl: string;
  /** Title for the iframe (accessibility) */
  title: string;
  /** Optional subtitle shown below the "Trailer" label */
  subtitle?: string;
  className?: string;
}

export function TrailerSection({
  embedUrl,
  title,
  subtitle = "Official / YouTube",
  className,
}: TrailerSectionProps) {
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
            Trailer
          </p>
          {subtitle && (
            <p className="text-sm text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-3xl bg-black">
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            title={`${title} trailer`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
