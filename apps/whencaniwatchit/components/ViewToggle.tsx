"use client";

import { useRouter, useSearchParams } from "next/navigation";

const VIEWS = [
  { id: "now_playing", name: "Now In Cinemas" },
  { id: "upcoming", name: "Coming Soon" },
];

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "now_playing";

  const handleViewChange = (viewId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewId);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-full border border-zinc-200/70 bg-white/80 p-1 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/80">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          onClick={() => handleViewChange(view.id)}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
            currentView === view.id
              ? "bg-sky-500 text-white shadow shadow-sky-500/40"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {view.name}
        </button>
      ))}
    </div>
  );
}
