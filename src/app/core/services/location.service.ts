import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { City, Country, PhoneCode } from '@b2b/models';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  selectedCity$: BehaviorSubject<City> = new BehaviorSubject(null);
  searchKeyName$: Subject<string> = new Subject<string>();

  constructor(private _http: HttpClient,
              private _config: ConfigService) {
  }

  /**
   * Retrieve available countries
   */
  getCountries(): Observable<Country[]> {
    const url = `${this._config.apiUrl}/country`;
    const obj = {
      'order-by[0][type]': 'field',
      'order-by[0][field]': `name${this._config.locale}`,
      'order-by[0][direction]': 'asc'
    };
    const params = new HttpParams({fromObject: obj});

    return this._http.get(url, {params})
      .pipe(
        map((res: any) => {
          return res._embedded.country;
        })
      );
  }

  getCountriesPhoneCodes(limit = -1): Observable<PhoneCode[]> {
    const obj: any = {
      'order-by[0][type]': 'field',
      'order-by[0][field]': `name${this._config.locale}`,
      'order-by[0][direction]': 'asc',
      limit
    };
    const params = new HttpParams({fromObject: obj});
    return this._http.get(`${this._config.apiUrl}/phone-codes`, {params})
      .pipe(map((res: any) => res._embedded.phone_codes));
  }

  /**
   * Retrieve available countries
   */
  getCities(query: string, regionId: number, limit = -1): Observable<City[]> {
    const obj: any = {
      'filter[0][type]': 'lowerlike',
      'filter[0][where]': 'or',
      'filter[0][field]': 'nameEn',
      'filter[0][value]': `${query}%`,
      'filter[1][type]': 'lowerlike',
      'filter[1][where]': 'or',
      'filter[1][field]': 'nameCn',
      'filter[1][value]': `${query}%`,
      'filter[2][type]': 'lowerlike',
      'filter[2][where]': 'or',
      'filter[2][field]': 'nameRu',
      'filter[2][value]': `${query}%`,
      'filter[3][type]': 'lowerlike',
      'filter[3][where]': 'or',
      'filter[3][field]': 'nameEn',
      'filter[3][value]': `%${query}%`,
      'filter[4][type]': 'lowerlike',
      'filter[4][where]': 'or',
      'filter[4][field]': 'nameCn',
      'filter[4][value]': `%${query}%`,
      'filter[5][type]': 'lowerlike',
      'filter[5][where]': 'or',
      'filter[5][field]': 'nameRu',
      'filter[5][value]': `%${query}%`,
      'filter[6][type]': 'innerjoin',
      'filter[6][field]': 'region',
      'filter[6][alias]': 'r',
      'order-by[0][type]': 'field',
      'order-by[0][field]': 'important',
      'order-by[0][direction]': 'desc',
      'order-by[1][type]': 'field',
      'order-by[1][field]': 'area',
      'order-by[1][direction]': 'desc',
      'limit': `${limit}`
    };
    if (regionId) {
      obj['filter[7][type]'] = 'eq';
      obj['filter[7][field]'] = 'id';
      obj['filter[7][where]'] = 'and';
      obj['filter[7][alias]'] = 'r';
      obj['filter[7][value]'] = `${regionId}`;
    }
    const params = new HttpParams({fromObject: obj});

    return this._http.get(`${this._config.apiUrl}/locality`, {params})
      .pipe(
        map((res: any) => {
          const localities = res._embedded.locality;

          localities.forEach((item: any) => {
            item.fullName = `${item['name' + this._config.locale]}`;
            item.fullName += `${item.area ? ' (' + item.area + ')' : ''}`;
          });

          return localities.sort((a: any, b: any) => a.fullName - b.fullName);
        })
      );
  }

  getCity(searchName: string, country?: number, region?: number, limit = 20): Observable<any> {
    const params: any = {
      searchName,
      limit,
      country,
      region,
    };
    return this._http.get(`${this._config.apiUrl}/search-locality`, {params: params})
      .pipe(
        map((res: any) => {
          return res._embedded.locality.map((loc) => {
            loc['fullNameRu'] = `${loc.nameRu} (${loc.region && loc.region.nameRu}${loc.area ? `, ${loc.area}` : ''}),
            ${loc.region && loc.region.country && loc.region.country.nameRu}`;
            loc['fullNameEn'] = `${loc.nameEn} (${loc.region && loc.region.nameEn}${loc.area ? `, ${loc.area}` : ''}),
            ${loc.region && loc.region.country && loc.region.country.nameEn}`;
            loc['fullNameCn'] = `${loc.nameCn} (${loc.region && loc.region.nameCn}${loc.area ? `, ${loc.area}` : ''}),
            ${loc.region && loc.region.country && loc.region.country.nameCn}`;

            return loc;
          });
        })
      );
  }

  setCordinat(data) {
    return this._http.post(`${this._config.apiUrl}/location`, data);
  }

}
