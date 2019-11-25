import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { ControlUnitType, Unit } from '@b2b/models';
import { removeEmptyProperties } from '@b2b/helpers/utils';

export interface ControlUnitEntityType {
  all: ControlUnitType[];
  calculated: ControlUnitType[];
  currency: ControlUnitType[];
  volumetric: ControlUnitType[];
  weighted: ControlUnitType[];
}

@Injectable({
  providedIn: 'root'
})
export class UnitsService {
  $associativeUnits = new BehaviorSubject(null);
  units: Unit[] = [];

  constructor(private _http: HttpClient,
              private _config: ConfigService) {
    this.getUnits().subscribe();
  }

  /**
   * Retrieves available units
   */
  getUnits(): Observable<Unit[]> {
    return this._http.get(`${this._config.apiUrl}/unit?limit=100`)
      .pipe(
        map((res: any) => {
          const assoc = {};
          res._embedded.unit.forEach(el => {
            assoc[el.id] = el;
          });
          this.$associativeUnits.next(assoc);
          return this.units = res._embedded.unit;
        }),
        publishReplay(1),
        refCount()
      );
  }

  /**
   * Gets unit by control unit type
   */
  getUnitByControlType(id: number): Unit[] {
    return this.units.filter((item: Unit) => {
      const controlUnitType = item.controlUnitType || item._embedded.controlUnitType;
      return +controlUnitType.id === +id;
    });
  }

  /**
   * Gets unit by given id and returns it proper localized value
   */
  getUnitById(id: number): string {
    const unit = this.units.find((value: Unit) => +value.id === +id);
    return unit && unit[`name${this._config.locale}`] || '';
  }

  getUnitFullById(id: number): any {
    return this.units.find((unit: Unit) => +unit.id === +id);
  }

  getPricePerUnit(query: any) {
    const params = new HttpParams({fromObject: query});
    return this._http.get(`${this._config.apiUrl}/get-price-per-unit`, {params});
  }

  getCurrencyPerUnit(query: any) {
    const params = new HttpParams({fromObject: query});
    return this._http.get(`${this._config.apiUrl}/get-currency-per-unit`, {params});
  }

  getUnitsByIds(ids: number[]): Unit[] {
    const res = [];
    ids.forEach(value => {
      const match = this.units.find(value1 => +value1.id === +value);
      if (match) {
        res.push(match);
      }
    });
    // return this._units.filter((unit) => ids.includes(+unit.id));   // в порядке _units
    return res;   // в порядке ids
  }

  getCurrencyAndPricePerUnit(query: any) {
    const params = new HttpParams({fromObject: removeEmptyProperties(query)});
    return this._http.get(`${this._config.apiUrl}/get-currency-and-price-per-unit`, {params});
  }

  /**
   * Returns showcase units
   */
  getShowcaseUnits(id: number): Observable<Unit[]> {
    const obj: any = {
      'filter[0][type]': 'eq',
      'filter[0][field]': 'showcase',
      'filter[0][value]': id
    };
    const params = new HttpParams({fromObject: obj});
    return this._http.get(`${this._config.apiUrl}/showcase-override-property`, {params})
      .pipe(
        map((res: any) => {
          return this.units = res._embedded.showcase_override_property;
        }),
        publishReplay(1),
        refCount()
      );
  }

  /**
   * Returns an entity to separate by type
   */
  groupUnits(units): ControlUnitEntityType {
    const u = {
      all: [],
      calculated: [], // 1
      currency: [], // 2
      volumetric: [], // 3
      weighted: [], // 4
    };

    for (let i = 0, len = units.length; i < len; i++) {
      const unit = units[i];
      if (unit._embedded && unit._embedded.controlUnitType) {
        unit.controlUnitType = unit._embedded.controlUnitType;
      }

      u.all.push(unit);

      if (+unit.controlUnitType.id === 1) {
        u.calculated.push(unit);
      } else if (+unit.controlUnitType.id === 2) {
        u.currency.push(unit);
      } else if (+unit.controlUnitType.id === 3) {
        u.volumetric.push(unit);
      } else if (+unit.controlUnitType.id === 4) {
        u.weighted.push(unit);
      }
    }
    return u;
  }
}
