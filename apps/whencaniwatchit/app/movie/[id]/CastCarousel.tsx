"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

type CastMember = {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
  department: string | null;
  imdbUrl: string | null;
};

type CastCarouselProps = {
  cast: CastMember[];
};

export function CastCarousel({ cast }: CastCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-4">
        {cast.map((member) => (
          <div
            key={member.id}
            className="min-w-0 flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_20%]"
          >
            <div className="rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                {member.profileUrl ? (
                  member.imdbUrl ? (
                    <a
                      href={member.imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                      aria-label={`View ${member.name} on IMDb`}
                    >
                      <Image
                        src={member.profileUrl}
                        alt={member.name}
                        fill
                        className="object-cover transition duration-200 hover:scale-[1.02]"
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                      />
                    </a>
                  ) : (
                    <Image
                      src={member.profileUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                    No photo
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {member.name}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {member.character}
              </p>
              {member.department && (
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500">
                  {member.department}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
