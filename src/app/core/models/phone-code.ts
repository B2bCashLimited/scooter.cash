import { Country } from './country';

export interface PhoneCode {
  countryCode: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  phoneCode: number;
  _embedded?: {
    country: Country;
  };
}
