"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Common streaming providers with their TMDB provider IDs
// Using 0 as special ID for theatrical/cinema releases
const STREAMING_PROVIDERS = [
  { id: 0, name: "Theaters (Theatrical)" },
  { id: 1, name: "Apple TV" },
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 15, name: "Hulu" },
  { id: 37, name: "Disney Plus" },
  { id: 192, name: "Google Play" },
  { id: 337, name: "Disney Plus" },
  { id: 2, name: "Apple iTunes" },
];

type PlatformFilterProps = {
  currentProviderId?: number;
};

export function PlatformFilter({ currentProviderId }: PlatformFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerValue = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    // Filters apply to the upcoming list. If you're on another view, switch to upcoming.
    params.set("view", "upcoming");

    if (providerValue) {
      params.set("provider", providerValue);
    } else {
      params.delete("provider");
    }

    router.push(`/?${params.toString()}`);
  };

  return (
    <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
      Platform
      <select
        defaultValue={currentProviderId?.toString() || ""}
        onChange={handlePlatformChange}
        className="mt-2 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
      >
        <option value="">All platforms</option>
        {STREAMING_PROVIDERS.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
    </label>
  );
}
