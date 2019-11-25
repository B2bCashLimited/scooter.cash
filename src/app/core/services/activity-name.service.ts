import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivityName } from '@b2b/models';

const ACTIVITY_API = {
  1: 'suppliers',
  2: 'manufacturers',
  3: 'customs-without-license',
  4: 'customs-brokers',
  5: 'international-auto-carriers',
  6: 'domestic-auto-carriers',
  7: 'international-rail-carriers',
  8: 'domestic-rail-carriers',
  9: 'international-air-carriers',
  10: 'domestic-air-carriers',
  11: 'sea-carriers',
  12: 'river-carriers',
  13: 'warehouse-rent',
  14: 'warehouses',
};

@Injectable({
  providedIn: 'root'
})
export class ActivityNameService {

  activityNames$ = new BehaviorSubject<ActivityName[]>(null);

  constructor(private _http: HttpClient,
              private _config: ConfigService) {
  }

  get activityNames(): ActivityName[] {
    return this.activityNames$.value;
  }

  /**
   * Retrieve available activity names
   */
  getActivityNames(): Observable<ActivityName[]> {
    return this._http.get(`${this._config.apiUrl}/activity-name`)
      .pipe(
        map((res: any) => {
          const resFandS = res._embedded.activity_name
            .filter((item) => item.keyName !== 'buyer') // Need only for backend
            .sort((a: ActivityName, b: ActivityName) => +a.id - +b.id);
          this.activityNames$.next(resFandS);
          return resFandS;
        })
      );
  }

  deleteActivity(activityName: number, id: number): Observable<any> {
    return this._http.delete(`${this._config.apiUrl}/${ACTIVITY_API[activityName]}/${id}`);
  }
}
