import { Unit } from './unit';

export interface CategoryProperty {
  descCn?: string;
  descEn?: string;
  descRu?: string;
  category: CategorySimpleSummary;
  categoryProperty?: number | any;
  controlUnitType: string;
  enabled: boolean;
  formula?: {
    value: string;
  };
  id: number;
  ignoredValues: any[];
  isActiveOnOrderForm: boolean;
  isChecked?: boolean;
  isDeleted: boolean;
  isFormula: boolean;
  measure?: {
    value: CategorySimpleSummary
  } | any;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  orderEnabled?: boolean;
  orderPriority: number;
  possibleValuesCn: PossibleValueSummary[];
  possibleValuesEn: PossibleValueSummary[];
  possibleValuesExt: any[];
  possibleValuesRu: PossibleValueSummary[];
  priority: number;
  propertyFunction: any;
  special: number;
  specialWorth: number;
  status: boolean;
  unit?: number;
  unitData?: {
    controlUnitType: string;
    descCn: string;
    descEn: string;
    descRu: string;
    id: number;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  useArea: number;
  valueType: number;
  viewType: number;
  waitingOffers: any;
  yandexPropertyName: any;
  _embedded?: {
    unit: Unit
  };
}

interface PossibleValueSummary {
  display: string;
  value: string;
}

export interface CategorySimpleSummary {
  id: number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}
