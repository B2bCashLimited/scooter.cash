import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcquiringService {

  constructor(private _http: HttpClient,
              private _config: ConfigService) {
  }

  saveTerminalData(body: {
    company: number,
    clientId: string,
    clientSecret: string,
    type: number    // AcquiringTypes
  }): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/acquiring`, body);
  }

  initPurchase(body: {freeOrderId: number, acquiringId: number}): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/init-purchase`, body);
  }
}
