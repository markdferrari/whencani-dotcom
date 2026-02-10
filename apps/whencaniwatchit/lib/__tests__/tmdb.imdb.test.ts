/// <reference types="node" />

import { strict as assert } from "node:assert";
import { mock, test } from "node:test";

import { getPersonExternalIds } from "../tmdb";

test("getPersonExternalIds returns IMDb identifier", async () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = mock.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

  const response = new Response(
    JSON.stringify({ imdb_id: "nm0000123" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );

  fetchMock.mock.mockImplementation(async () => response.clone());
  // @ts-expect-error intentionally replacing fetch during test
  globalThis.fetch = fetchMock;

  try {
    const result = await getPersonExternalIds(1234);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.ok(fetchMock.mock.calls[0]?.arguments[0]?.toString().includes("/person/1234/external_ids"));
    assert.equal(result?.imdb_id, "nm0000123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
