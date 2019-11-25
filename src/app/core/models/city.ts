import { Region } from './region';

export interface City {
  _links: any;
  area: string;
  id: number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  region: Region;
}
