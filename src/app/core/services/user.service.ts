import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Site, User } from '@b2b/models';
import { ConfigService } from './config.service';
import { setToLocalStorage } from '@b2b/helpers/utils';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  currentUser$ = new BehaviorSubject<User>(null);
  userGeoData$ = new BehaviorSubject<{city: any, region: any; country: any}>(null);
  userCompany$ = new BehaviorSubject<any>(null);
  domainData$ = new BehaviorSubject<Site>(null);

  private _currentUser: User;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _http: HttpClient,
    private _config: ConfigService) {
  }

  set currentUser(value: User) {
    if (this._currentUser !== value) {
      this._currentUser = value;

      if (isPlatformBrowser(this.platformId)) {
        setToLocalStorage('B2B_USER_ID', +value.id);
      }

      this.currentUser$.next(value);
    }
  }

  get currentUser(): User {
    return this._currentUser;
  }

  getUserById(id: number): Observable<User> {
    return this._http.get<User>(`${this._config.apiUrl}/users/${id}`);
  }

  updateUser(id: number, body: any): Observable<User> {
    return this._http.put(`${this._config.apiUrl}/users/${id}`, body)
      .pipe(map((res: User) => this.currentUser = res));
  }

  changePassword(data: {currentPassword: string; newPassword: string; confirmedPassword: string}) {
    const body = {userId: +this.currentUser.id, ...data};

    return this._http.put(`${this._config.apiUrl}/change-password`, body);
  }

  getGeoDataByIp(): Observable<any> {
    return this._http.get(`${this._config.apiUrl}/geo-data-by-ip`)
      .pipe(
        map((res: {city: any, region: any; country: any}) => {
          if (res.city && Object.keys(res.city).length && res.region && Object.keys(res.region).length
            && res.country && Object.keys(res.country).length) {
            res.city['fullNameRu'] = `${res.city.nameRu} (${res.region && res.region.nameRu}), ${res.country && res.country.nameRu}`;
            res.city['fullNameEn'] = `${res.city.nameEn} (${res.region && res.region.nameEn}), ${res.country && res.country.nameEn}`;
            res.city['fullNameCn'] = `${res.city.nameCn} (${res.region && res.region.nameCn}), ${res.country && res.country.nameCn}`;
          }

          this.userGeoData$.next(res);
          return res;
        })
      );
  }

  canConfirmUserCart(ids: string): Observable<{status: boolean}> {
    return this._http.get(`${this._config.apiUrl}/can-confirm-user-cart?id=${ids}`)
      .pipe(map((res: {status: boolean}) => res));
  }

  getUserDataByDomain(domain: string): Observable<Site> {
    const obj: any = {
      'filter[0][type]': 'eq',
      'filter[0][field]': 'domain',
      'filter[0][value]': `${domain}`,
    };

    const params = new HttpParams({fromObject: obj});
    return this._http.get(`${this._config.apiUrl}/sites`, {params})
      .pipe(
        map((res: any) => {
          const site: Site = res._embedded && res._embedded.site && res._embedded.site[0];

          if (site) {
            site.activityName = site['_embedded']['activityName'];
            site.company = site['_embedded']['company'];
            delete site['_embedded'];
          }

          return site;
        })
      );
  }
}
