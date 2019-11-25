export interface Category {
  _embedded: {
    properties: { _links: any }[],
    showcases: { _links: any }[],
    orders: { _links: any }[],
    tnveds: { _links: any }[],
    etsngs: { _links: any }[],
    categories: Category[];
  };
  _links: any;
  autoForm: boolean;
  descCn: string;
  descEn: string;
  descRu: string;
  enabled: boolean;
  id: number;
  tnveds?: any[];
  etsngs?: any[];
  nameCn: string;
  nameEn: string;
  nameRu: string;
  orderForm: string;
  orderPreview: string;
  path: string;
  pId: string;
}

export interface CategorySimple {
  id: number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}
