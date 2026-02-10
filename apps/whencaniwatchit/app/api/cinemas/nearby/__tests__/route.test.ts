import { test, describe, mock, beforeEach } from "node:test";
import { strict as assert } from "node:assert";
import { POST } from "../route";

const originalFetch = global.fetch;

describe("POST /api/cinemas/nearby", () => {
  beforeEach(() => {
    global.fetch = mock.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("should return nearby cinemas", async () => {
    const mockOverpassResponse = {
      elements: [
        {
          id: 123456,
          lat: 51.5074,
          lon: -0.1278,
          tags: {
            name: "The Cinema",
            "addr:street": "123 Main St",
          },
        },
        {
          id: 123457,
          lat: 51.508,
          lon: -0.128,
          tags: {
            name: "Vue Cinema",
          },
        },
      ],
    };

    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify(mockOverpassResponse),
    }));

    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          radiusKm: 15,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert(Array.isArray(data.cinemas));
    assert(data.cinemas.length >= 1);
    assert(data.cinemas[0].name);
    assert(typeof data.cinemas[0].distanceKm === "number");
  });

  test("should reject missing lat/lng", async () => {
    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({ radiusKm: 15 }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 400);
  });

  test("should reject invalid coordinates", async () => {
    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({
          lat: "not a number",
          lng: -0.1278,
          radiusKm: 15,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 400);
  });

  test("should reject radius outside valid range", async () => {
    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          radiusKm: 150,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 400);
  });

  test("should return empty array if no cinemas found", async () => {
    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ elements: [] }),
    }));

    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          radiusKm: 15,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.deepEqual(data.cinemas, []);
  });

  test("should handle Overpass error", async () => {
    (global.fetch as any).mock.mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
    }));

    const request = new Request(
      "http://localhost:3000/api/cinemas/nearby",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 51.5074,
          lng: -0.1278,
          radiusKm: 15,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    assert.equal(response.status, 500);
  });
});
