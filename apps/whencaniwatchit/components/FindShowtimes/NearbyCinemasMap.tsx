"use client";

import L from "leaflet";
import type { NearbyCinema } from "@/lib/types/cinemas";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type LatLng = {
  lat: number;
  lng: number;
};

export type NearbyCinemasMapProps = {
  center: LatLng;
  radiusKm: number;
  cinemas: NearbyCinema[];
};

function googleMapsUrl(lat: number, lng: number, name?: string): string {
  if (name) {
    return `https://www.google.com/maps?q=${encodeURIComponent(name)}`;
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function NearbyCinemasMap({ center, radiusKm, cinemas }: NearbyCinemasMapProps) {
  const radiusMeters = Math.max(0, radiusKm) * 1000;

  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border border-secondary">
      <MapContainer
        center={L.latLng(center.lat, center.lng)}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Search radius */}
        {radiusMeters > 0 && (
          <Circle
            center={L.latLng(center.lat, center.lng)}
            radius={radiusMeters}
            pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.08 }}
          />
        )}

        {/* Center point */}
        <CircleMarker
          center={L.latLng(center.lat, center.lng)}
          radius={6}
          pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.9 }}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-medium">Search center</div>
              <a
                href={googleMapsUrl(center.lat, center.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 underline"
              >
                View in Google Maps
              </a>
            </div>
          </Popup>
        </CircleMarker>

        {/* Cinemas */}
        {cinemas.map((cinema) => (
          <CircleMarker
            key={cinema.id}
            center={L.latLng(cinema.lat, cinema.lng)}
            radius={7}
            pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.85 }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-medium">{cinema.name}</div>
                {cinema.address && <div className="text-sm">{cinema.address}</div>}
                <div className="text-sm text-zinc-600">
                  {cinema.distanceKm < 1
                    ? `${Math.round(cinema.distanceKm * 1000)}m away`
                    : `${cinema.distanceKm.toFixed(1)}km away`}
                </div>
                <a
                  href={googleMapsUrl(cinema.lat, cinema.lng, cinema.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 underline"
                >
                  View in Google Maps
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
