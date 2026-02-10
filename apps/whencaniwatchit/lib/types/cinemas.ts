export type GeocodeResponse = {
  lat: number;
  lng: number;
  displayName: string;
};

export type NearbyCinema = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  distanceKm: number;
};

export type NearbyCinemasResponse = {
  cinemas: NearbyCinema[];
  count: number;
};

export type GeocodeRequest = {
  city: string;
};

export type NearbyCinemasRequest = {
  lat: number;
  lng: number;
  radiusKm: number;
};
