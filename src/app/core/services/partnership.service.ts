import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PartnershipService {

  constructor(
    private _http: HttpClient,
    private _config: ConfigService) {
  }

  /**
   * Retrieves available units
   */
  invitePartner(body: any): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/invite-partner`, body);
  }

  /**
   * Retrieves available units
   */
  addPartner(body: any): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/partnership`, body);
  }

  /**
   * Retrieves available units
   */
  getPartners(activeCompanyId: number, type: string): Observable<any> {
    const query = {
      'filter[0][type]': 'eq',
      'filter[0][value]': `${activeCompanyId}`,
      'filter[0][field]': `${type}`,
      'filter[0][where]': 'and',
      'filter[1][type]': 'eq',
      'filter[1][field]': 'type',
      'filter[1][value]': `${type}`,
      'filter[2][type]': 'eq',
      'filter[2][field]': 'status',
      'filter[2][value]': '0'
    };
    const params = new HttpParams({fromObject: query});

    return this._http.get(`${this._config.apiUrl}/partnership`, {params})
      .pipe(
        map((res: any) => res._embedded.partnership)
      );
  }

  getPartnershipActivities(company: number, partner: number, activityNames: number[]) {
    const query = {
      'company': `${company}`,
      'partner': `${partner}`
    };
    activityNames.forEach((act, i) => {
      query[`activityName[${i}]`] = `${act}`;
    });
    const params = new HttpParams({fromObject: query});

    return this._http.get(`${this._config.apiUrl}/get-partnership-activities`, {params});
  }

  hasPartners(companyId: number, activityName: number) {
    const query = {
      company: `${companyId}`,
      activityName: `${activityName}`
    };
    const params = new HttpParams({fromObject: query});

    return this._http.get(`${this._config.apiUrl}/have-partners`, {params})
      .pipe(map((res) => res['havePartner']));
  }

  deletePartnership(id: any): Observable<any> {
    return this._http.delete(`${this._config.apiUrl}/partnership/${id}`);
  }

  updatePartnership(id: any, body: any): Observable<any> {
    return this._http.put(`${this._config.apiUrl}/partnership/${id}`, body);
  }

  getCountRequestsPartnership(companyId: number, requestsFor: 'company' | 'activity'): Observable<any> {
    const query = {
      companyId: `${companyId}`,
      requestsFor: `${requestsFor}`
    };
    const params = new HttpParams({fromObject: query});
    return this._http.get(`${this._config.apiUrl}/get-count-requests-partnership`, {params})
      .pipe(map(res => res['partnershipRequests']));
  }

  /**
   * Checks if company and activity are partners
   */
  checkPartnership(companyId: number, activityId: number, activityName?: string, activityNameId?: number): Observable<any> {
    const params = {
      companyId: `${companyId}`,
      activityId: `${activityId}`,
      activityName: `${activityName}` || '',
      activityNameId: `${activityNameId}` || ''
    };
    return this._http.get(`${this._config.apiUrl}/check-partnership`, {params});
  }
}
