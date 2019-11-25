export interface Company {
  cashPayments: boolean;
  cashlessPaymentsOnCard: boolean;
  cashlessPaymentsVATIncluded: boolean;
  cashlessPaymentsWithoutVAT: boolean;
  companyDetails: any[];
  companyDetailsCn: any;
  companyDetailsEn: any;
  companyDetailsRu: any;
  dateDeleted: {
    date: Date;
  };
  deleted: boolean;
  email: string;
  emailSender: any[];
  id: string;
  individual: boolean;
  isGiftGotten: boolean;
  legalAddress: LegalAddress;
  logo: any[];
  message: any;
  name: string;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  numberEmployees: number;
  officeArea: number;
  rating: number;
  receiveMarketingEmails: boolean;
  receiveOrderEmails: boolean;
  selected: boolean;
  shortName: string;
  shortNameCn: string;
  shortNameEn: string;
  shortNameRu: string;
  siteUrls: any[];
  status: number;
  user: {
    id: string;
  };
  yearOfFound: string;
  _embedded: any;
}

interface LegalAddress {
  city: number;
  cityNameCn: string;
  cityNameEn: string;
  cityNameRu: string;
  country: string;
  countryNameCn: string;
  countryNameEn: string;
  countryNameRu: string;
  geoObject: {
    address: string;
    lat: number;
    lng: number;
  };
  id: string;
  region: string;
  regionNameCn: string;
  regionNameEn: string;
  regionNameRu: string;
}
