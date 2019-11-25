import { ControlUnitType } from './control-unit-type';

export interface Unit {
  _links: any;
  _embedded: {controlUnitType: ControlUnitType};
  controlUnitType?: ControlUnitType;
  descCn: string;
  descEn: string;
  descRu: string;
  id: string | number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

export interface UnitSummaryShort {
  descCn: string | null;
  descEn: string | null;
  descRu: string | null;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}
