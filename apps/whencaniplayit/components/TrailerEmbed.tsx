'use client';

interface TrailerEmbedProps {
  videoId?: string;
  title: string;
}

export function TrailerEmbed({ videoId, title }: TrailerEmbedProps) {
  if (!videoId) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 mb-4">
        Trailer
      </p>
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute inset-0 h-full w-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={`${title} Trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
