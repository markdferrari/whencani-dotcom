import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { BookshelfSection } from "@/components/BookshelfSection";

export const metadata: Metadata = {
  title: "My Bookshelf | WhenCanIReadIt.com",
  description: "View and manage your saved books.",
};

export default function BookshelfPage() {
  if (!config.features.bookshelfPage) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_45%)]">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="hidden sm:block rounded-3xl border border-zinc-200/70 bg-white/90 p-8 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
            Bookshelf
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Your saved books, all in one place
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            Keep track of books you want to read. Toggle the star on any book to
            add or remove it from your bookshelf.
          </p>
        </section>

        <BookshelfSection />

        <div className="flex gap-4 mt-6">
          <a
            href="https://whencaniplayit.com/watchlist"
            className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-600"
          >
            My Games
          </a>
        </div>
        <div className="flex gap-4 mt-6">
          <a
            href="https://whencaniwatchit.com/watchlist"
            className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-600"
          >
            My Movies
          </a>
        </div>
      </main>
    </div>
  );
}
