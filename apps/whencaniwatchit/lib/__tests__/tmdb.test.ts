import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPersonExternalIds } from "../tmdb";

describe("getPersonExternalIds", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("fetches the TMDB person external IDs and returns the IMDb identifier", async () => {
    const mockResponse = {
      imdb_id: "nm0000123",
    };

    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getPersonExternalIds(42);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/person/42/external_ids"),
      expect.any(Object),
    );
    expect(result?.imdb_id).toBe("nm0000123");
  });
});
