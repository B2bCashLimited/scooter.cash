export class Geolocation {
  name?: string;
  nameEn?: string;
  nameRu?: string;
  nameCn?: string;
  type?: string;
  id?: string;
  country?: Geolocation;
  active?: boolean;
  coords?: { lat: string, lng: string };
  _embedded?: {region: {
    _embedded: {country: Geolocation}
  }};
  region?: {
    country?: Geolocation
  };
}
