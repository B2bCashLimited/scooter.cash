export interface Create {
  chat: {
    name: string;
    type: number;
  };
  owner: {
    userId: number;
    companyId: number;
    isCustomer: boolean;
    // Необязательные параметры
    activity?: string;
    activityId?: number;
  };
  relations:
    {
      userId: number;
      companyId: number;
      // Необязательные параметры
      activity?: string;
      activityId?: number;
    }[];
}

export interface Contacts {
  chatId?: number;
  page?: number;
  limit?: number;
  query?: string;
  categoryName?: string;
  type: number;
  owner: number;
  myCompany: number;
  myActivity?: string;
  activitySubId?: number;
  append?: number;
}

export interface Chat {
  chatType: number;
  closed: any;
  dateCreated: any;
  deleted: boolean;
  id: number;
  lastMessage: string;
  logo: any;
  name: string;
  relations: Relations[];
  _embedded: {
    ownerCompany: any;
  };
  _links: any;
}

export interface Relations {
  activityId: string | number;
  activityKey: string;
  activityName: string;
  banned?: boolean;
  companyId: number;
  companyLogo?: any[];
  companyName: string;
  id: number;
  owner?: boolean;
  userId: number;
  userName?: string;
  userSurname?: string;
}

export interface RelationsAddToGroup {
  chatId: number;
  userId: number;
  companyId: number;
  isCustomer: boolean;
  // Необязательные параметры
  activity: string;
  activityId: number;
}

export interface SelectedActivity {
  companyId: number;
  activityKey: string;
  activityId: number;
}

export interface Message {
  activityId: number;
  activityKey: string;
  activityName: string;
  attributes?: any;
  chat_id: number;
  chat_relations_id: number;
  companyName: string;
  date_send: string;
  firstname: string;
  id: number;
  lastname: string;
  readby: number[];
  status: number;
  text: string;
  type: string;
  user_id: number;
}
