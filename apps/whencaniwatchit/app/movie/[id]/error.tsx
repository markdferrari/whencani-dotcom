"use client";

import Link from "next/link";
import { useEffect } from "react";

type MovieErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MovieError({ error, reset }: MovieErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-red-500">
            Something went wrong
          </p>
          <p className="mt-3 font-semibold">We could not load this movie.</p>
          <p className="mt-2 text-red-600">{error.message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="rounded-full bg-red-600 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-full border border-red-200 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-700"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
