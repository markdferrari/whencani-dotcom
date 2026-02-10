import { test, describe, mock, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { POST } from "../route";

// Mock fetch globally
const originalFetch = global.fetch;

describe("POST /api/geocode", () => {
  beforeEach(() => {
    global.fetch = mock.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("should geocode valid city name", async () => {
    const mockGeocodeResponse = [
      {
        lat: "51.5074",
        lon: "-0.1278",
        display_name: "London, England",
      },
    ];

    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => mockGeocodeResponse,
    }));

    const request = new Request("http://localhost:3000/api/geocode", {
      method: "POST",
      body: JSON.stringify({ city: "London" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.lat, 51.5074);
    assert.equal(data.lng, -0.1278);
    assert.equal(data.displayName, "London, England");
  });

  test("should reject missing city", async () => {
    const request = new Request("http://localhost:3000/api/geocode", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    assert.equal(response.status, 400);

    const data = await response.json();
    assert(data.error);
  });

  test("should reject empty city", async () => {
    const request = new Request("http://localhost:3000/api/geocode", {
      method: "POST",
      body: JSON.stringify({ city: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    assert.equal(response.status, 400);
  });

  test("should reject city that returns no results", async () => {
    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: true,
      json: async () => [],
    }));

    const request = new Request("http://localhost:3000/api/geocode", {
      method: "POST",
      body: JSON.stringify({ city: "FakeCity123456" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    assert.equal(response.status, 404);
  });

  test("should return 500 on Nominatim error", async () => {
    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
    }));

    const request = new Request("http://localhost:3000/api/geocode", {
      method: "POST",
      body: JSON.stringify({ city: "London" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    assert.equal(response.status, 500);
  });
});
