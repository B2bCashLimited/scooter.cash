import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private _http: HttpClient,
    ) {
  }

  postLead(getParams, data: any): Observable<any> {
    const title = getParams.params.utm_source
      ? 'Заявка с scooter, источник: ' + getParams.params.utm_source + ', товары: ' + data.name_ru
      : '';
    const roistat = this._document.cookie.split(';').find(value => value.includes('roistat_visit')).trim();
    const params: any = {
      ...getParams.params,
      ...data,
      title,
      roistat,
    };

    return this._http.post('https://backend.b2b.cash:9900/api/v1/create-bitrix24-lead', params);
  }
}
