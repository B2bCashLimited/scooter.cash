import { CategoryProperty } from './category-property';
import { Company } from './company';
import { Region } from './region';

export interface MyOrders {
  adminCheckboxes: any[];
  alternative: boolean;
  brutMe: {
    code: any;
    descCn: string;
    descEn: string;
    descRu: string;
    id: string;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  category: Category;
  childFreeOrders: any[];
  company: Company;
  contract: any;
  countMe: CountMe;
  currency: Currency;
  dateCreated: {
    date: Date;
  };
  dateExpired: {
    date: Date;
  };
  dateUpdated: {
    date: Date;
  };
  deliveryAddress: DeliveryAddress;
  deliveryPrice: any;
  expired: boolean;
  fromCart: boolean;
  id: string;
  netMe: NetMe;
  paid: boolean;
  paymentOption: PaymentOption;
  paymentStatus: any;
  paymentTypeOptions: PaymentTypeOptions;
  pickupAddress: any;
  pickupCity: any;
  previewProducts: PreviewProducts[];
  products?: any[];
  productsCount: string;
  proposal: any;
  proposalData: any[];
  proposalMinPrice: string;
  proposalsCount: number;
  scope: {
    id: string;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  status: {
    id: string;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  supplierOrManufacturer: number;
  takenActivity: any;
  takenActivityName: any;
  takenCompany: any;
  totalBrut: string;
  totalCount: number;
  totalNet: string;
  totalPrice: string;
  totalVolume: string;
  useDefaultContract: boolean;
  volumeMe: VolumeMe;
  _links: any;
}

interface Category {
  autoForm: boolean;
  dateCreated: {
    date: Date;
  };
  enabled: boolean;
  googleCategoryId: any;
  iconClass: any;
  iconClassColor: any;
  iconImage: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  nameRuTransliterated: string;
  pId: any;
  path: string;
  properties: CategoryProperty[];
  status: number;
  viewedByModerator: boolean;
  yandexCategoryId: any;
}

interface CountMe {
  code: any;
  descCn: string;
  descEn: string;
  descRu: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface Currency {
  code: any;
  descCn: string;
  descEn: string;
  descRu: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface VolumeMe {
  code: any;
  descCn: string;
  descEn: string;
  descRu: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface DeliveryAddress {
  address: string;
  id: string;
  lat: any;
  lng: any;
  locality: {
    area: any;
    id: string;
    important: boolean;
    nameCn: string;
    nameEn: string;
    nameRu: string;
    region: Region;
  };
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface NetMe {
  code: any;
  descCn: string;
  descEn: string;
  descRu: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface PaymentOption {
  descCn: string;
  descEn: string;
  descRu: string;
  id: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
}

interface PaymentTypeOptions {
  cashPayments: boolean;
  cashlessPaymentsWithoutVAT: boolean;
  cashlessPaymentsOnCard: boolean;
  cashlessPaymentsVATIncluded: boolean;
}

interface PreviewProducts {
  currency: {
    id: number;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  id: string;
  isPriceFormula: boolean;
  manufacturer: {
    id: string;
    nameCn: string;
    nameEn: string;
    nameRu: string;
  };
  nameCn: string;
  nameEn: string;
  nameRu: string;
  paymentOptionId: number;
  photos: Photo[];
  price: string;
}

interface Photo {
  link: string;
  name: string;
  numberInput: any;
  type: string;
}
