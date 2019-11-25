export interface User {
  id: number;
  dateCreate: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  login: string;
  middleName: string;
  phoneCode?: string;
  phone: string;
  isDeleted: boolean;
  status: string;
  photos: Photos[];
  resources: any[];
  blackListCompanies: any[];
  bannedInChatTo?: any;
  adminLevel: number;
  adminPosition: string;
  _links: any;
  _embedded: any;
  page_count: number;
  page_size: number;
  total_items: number;
  page: number;
}

interface Photos {
  link: string;
  name: string;
  type: string;
  numberInput: string;
}
