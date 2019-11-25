import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor, HttpParams,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ConfigService } from './config.service';
import { isPlatformBrowser } from '@angular/common';
import { clearLocalStorage, getFromLocalStorage } from '@b2b/helpers/utils';

const API_NAMES = [
  'activity-name',
  'adrs',
  'air-port',
  'carting-type',
  'categories',
  'categories-tree',
  'categories-tree-products',
  'category-search',
  'category-top',
  'container-loading-types',
  'container-names',
  'container-types',
  'container-versions',
  'containers',
  'control-unit-types',
  'country',
  'currency',
  'customs-ports',
  'delivery-type',
  'etsngs',
  'incoterm',
  'last-categories',
  'locality',
  'order-type',
  'payment',
  'payment-option',
  'phone-codes',
  'railway-station',
  'region',
  'river-port',
  'route-type',
  'sea-port',
  'search-locality',
  'search-city-and-region',
  'service-types',
  'time-zone',
  'tnveds',
  'transport-types',
  'transports',
  'unit',
];

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _config: ConfigService,
    private _router: Router,
    ) {
  }

  /**
   * Intercept an outgoing http request and optionally transform it or the response.
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let auth: any;

    if (isPlatformBrowser(this.platformId)) {
      auth = getFromLocalStorage('B2B_AUTH');
    }

    if (auth && auth.access_token && !(/employee-change-password/).test(req.url) && !(/create-bitrix24-lead/).test(req.url)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${auth.access_token}`
        }
      });
    }
    if (req.url.indexOf(this._config.apiUrl) !== -1 && !(/[get|delete]+-dictionary-cache/).test(req.url)) {
      return this.handleRequest(req, next);
    }
    return next.handle(req);
  }

  /**
   * Handle each request for api and set Authorization header if logged in
   */
  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = this.filterParams(req);
    req = this.callApiThroughCache(req);

    return next.handle(req)
      .pipe(
        tap((evt: HttpEvent<any>) => {
            if (evt instanceof HttpResponse) {
              // TODO something with response
            }
            return evt;
          },
          (err: any) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status === 401) {
                if (isPlatformBrowser(this.platformId)) {
                  clearLocalStorage();
                }

                this._router.navigateByUrl('sign-in')
                  .catch((e) => console.log(e));
              }
            }
          })
      );
  }

  private callApiThroughCache(req: HttpRequest<any>): HttpRequest<any> {
    const match = req.urlWithParams.match(/(\/api\/v\d\/)(.+)/);
    const [apiUrl, apiVersion, apiName] = match;
    const api = (apiName || '').split('?').shift().split('/')[ 0 ];
    if ((API_NAMES.indexOf(api) >= 0) && (/get/i).test(req.method)) {
      const url = `${this._config.apiUrl}/get-dictionary-cache?url=${apiUrl}`;
      const httpRequest = new HttpRequest(<any>req.method, url);
      req = Object.assign(req, httpRequest);
    }
    return req;
  }

  private filterParams(req: HttpRequest<any>): HttpRequest<any> {
    const params = req.params;
    const keys = params.keys();
    if (keys && keys.length > 0) {
      const obj = params.keys()
        .filter((key) => {
          const value = params.get(key);
          if (typeof value === 'string' && ((/^(undefined|null)/).test(value))) {
            return false;
          }
          return !(value === undefined || value === null);
        })
        .reduce((objReduce, key) => {
          objReduce[ key ] = params.get(key);
          return objReduce;
        }, {});

      req = req.clone({
        params: new HttpParams({ fromObject: obj })
      });
    }
    return req;
  }
}
