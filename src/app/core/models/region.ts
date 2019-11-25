import { Country } from './country';

export interface Region {
  _links: any;
  country: Country;
  exeption?: any;
  id: number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  regionCode?: string;
}
