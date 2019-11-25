import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { NotificationTypes, ViewOrderSections } from '@b2b/constants';
import { GlobalOrderNotification } from '@b2b/models';
import { Notification } from '@b2b/models';
import { ConfigService } from './config.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class CountersService {
  chatTypes = [NotificationTypes.NEW_MESSAGE, NotificationTypes.SYSCHAT_CLOSED];
  counters: any;
  counterParamName = 'counter';
  notifications: Notification[] = [];
  notificationsIdsByChat = new Map<number, number[]>();
  bellCount$ = new BehaviorSubject<any>(null);
  chatCount$ = new BehaviorSubject<any>(null);

  activityName = {
    1: 'suppliers',
    2: 'manufacturers',
    3: 'customsWithoutLicenses',
    4: 'customsBrokers',
    5: 'internationalTruckers',
    6: 'domesticTruckers',
    7: 'internationalRailCarriers',
    8: 'domesticRailCarriers',
    9: 'internationalAirCarriers',
    10: 'domesticAirCarriers',
    11: 'seaCarriers',
    12: 'riverCarriers',
    13: 'warehousesRents',
    14: 'warehouses',
    15: 'buyers'
  };

  constructor(
    private _config: ConfigService,
    private _http: HttpClient,
    private _userService: UserService,
  ) {
  }

  public get companyCounters(): Counter {
    const _company = this.counters && this.counters.companies.find(res => +res.id === +this.companyId);
    return _company ? _company.counters : null;
  }

  get myCounter() {
    return this.companyCounters && this.companyCounters.my;
  }

  get companyId() {
    return this._userService.userCompany$.value && +this._userService.userCompany$.value.id;
  }

  get userId() {
    return this._userService.currentUser && +this._userService.currentUser.id;
  }

  get bellCounter() {
    return (this.companyCounters && (
        this.myCounter.confirmed.total +
        this.myCounter.afterCalcPartner.total +
        this.myCounter.afterCalcPortal.total
      ));
  }

  get chatCounter(): number {   // число в хедере
    return this.notifications && this.notifications.filter(value => !value.read && +value.company_id === +this.companyId &&
      this.chatTypes.includes(value.type)).length;
  }

  get newBuyersMessages(): Notification[] {
    const buyerNotes = this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.NEW_MESSAGE && value.attributes.message && !value.attributes.message.activityId &&
      value.attributes.message.company_id && +value.company_id === +this.companyId);
    return this.filterByUniqChat(buyerNotes);
  }

  get newSellersMessages(): Notification[] {
    const sellerNotes = this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.NEW_MESSAGE && value.attributes.message && value.attributes.message.activityId &&
      value.attributes.message.company_id && +value.company_id === +this.companyId);
    return this.filterByUniqChat(sellerNotes);
  }

  get newSystemChatsClosed(): Notification[] {
    return this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.SYSCHAT_CLOSED && +value.company_id === +this.companyId);
  }

  get newPartnershipsApproved(): Notification[] {
    return this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.PARTNER_APPROVED && +value.company_id === +this.companyId);
  }

  get newPartnershipsCanceled(): Notification[] {
    return this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.PARTNER_CANCELED && +value.company_id === +this.companyId);
  }

  get newPartnershipsBrokeUp(): Notification[] {
    return this.notifications && this.notifications.filter(value => !value.read &&
      value.type === NotificationTypes.PARTNER_BROKE_UP && +value.company_id === +this.companyId);
  }

  /**
   * Filters notifications by chat and counts new messages for every chat (used for ChatNotifications)
   */
  filterByUniqChat(initArray: Notification[], useLastMessage = false): Notification[] {
    const uniqChats = Array.from(new Set(initArray.map(value => +value.attributes.message.chat_id)).values());
    const uniqChatsNotes = [];
    uniqChats.forEach(value => {
      const arr = initArray.filter(value1 => +value1.attributes.message.chat_id === +value);
      const index = useLastMessage ? (arr.length - 1) : 0;
      arr[index][this.counterParamName] = arr.length;   // добавляем счетчик новых сообщений этого чата
      uniqChatsNotes.push(arr[index]);
      this.notificationsIdsByChat.set(value, arr.map(val => +val.id));
    });
    return uniqChatsNotes;
  }

  /**
   * Универсальная версия filterByUniqChat, но неоттестирован пока
   * @param initArray - blah
   * @param notesIdsMap - мэп с (param: id_уведомления) - для последующей пометки уведомлений прочитанными
   * @param param - параметр для фильтрации. В случае массива: ['attributes', 'message', 'chat_id']
   * @param counterName - название добавляемого свойства счетчика количества одинаковых элементов (т.е. с одним и тем же param)
   * @param useLast - использовать последний (или первый) из одинаковых элементов
   */
  filterByUniqParam(initArray: Notification[], notesIdsMap: Map<any, number[]>, param: string | string[],
                    counterName: string, useLast = false): Notification[] {
    const uniqParams = Array.from(new Set(initArray.map(value => {
      if (!Array.isArray(param)) {
        return value[param];
      }
      let res = value;
      for (let i = 0; i < param.length; i++) {
        res = res[param[i]];
      }
      return res;
    })).values());
    const uniqNotes = [];
    uniqParams.forEach(value => {
      const arr = initArray.filter(value1 => {
        if (!Array.isArray(param)) {
          return value1[param] === value;
        }
        let res = value1;
        for (let i = 0; i < param.length; i++) {
          res = res[param[i]];
        }
        return res === value;
      });
      const index = useLast ? (arr.length - 1) : 0;
      arr[index][counterName] = arr.length;   // добавляем счетчик новых сообщений этого чата
      uniqNotes.push(arr[index]);
      notesIdsMap.set(value, arr.map(val => +val.id));
    });
    return uniqNotes;
  }

  getOrderCounters(userId) {
    return this._http.get(`${this._config.chatUrl}/users/${userId}/order-counters`)
      .pipe(
        map((res: any) => {
          if (res.companies) {
            this.counters = res;
          }
          this.bellCount$.next(this.bellCounter);
          this.chatCount$.next(this.chatCounter);
          return of(res);
        })
      );
  }

  getGlobalNotifications(userId): Observable<any> {
    return this._http.get(`${this._config.chatUrl}/users/${userId}/notifications`)
      .pipe(
        map((res: Notification[]) => {
          this.notifications = res;
          this.bellCount$.next(this.bellCounter);
          this.chatCount$.next(this.chatCounter);
        }));
  }

  getNewOrdersNotifications(companyId): Observable<GlobalOrderNotification[]> {
    const params = new HttpParams({fromObject: {companyId}});
    return this._http.get(`${this._config.apiUrl}/group-order-notifications`, {params})
      .pipe(
        map((res: GlobalOrderNotification[]) => {
          this.bellCount$.next(this.bellCounter);
          this.chatCount$.next(this.chatCounter);
          return res;
        })
      );
  }

  /**
   * сообщаем серверу о том, что посмотрели заказ
   */
  viewItem(id, section) {
    return this._http.post(`${this._config.apiUrl}/add-viewed-object`, {id, section});
  }

  viewAllItems(entityIds: number[], section: ViewOrderSections) {
    return forkJoin(
      entityIds.map(id => this._http.post(`${this._config.apiUrl}/add-viewed-object`, {id, section}))
    );
  }

  /**
   * Marks notifications as READ
   */
  viewChatNotificationsByChatId(chatId: number): Observable<any> {
    const arr = this.notificationsIdsByChat.get(chatId);
    const body = {
      id: arr.join(',')
    };
    return this._http.post(`${this._config.apiUrl}/viewed-notification`, body).pipe(map(value => {
      this.notifications = this.notifications.filter(value1 => arr.indexOf(value1.id) === -1);
      this.notificationsIdsByChat.delete(chatId);
      this.bellCount$.next(this.bellCounter);
      this.chatCount$.next(this.chatCounter);
      return value;
    }));
  }

  viewNotification(notificationId: number | number[] | Notification[]): Observable<any> {
    let ids;
    if (typeof notificationId === 'number') {
      ids = notificationId;
    } else if (notificationId.length && typeof notificationId[0] === 'number') {
      ids = notificationId.join(',');
    } else if (notificationId.length && typeof notificationId[0] === 'object') {
      ids = (<Notification[]>notificationId).map(value => +value.id).join(',');
    }
    const body = {
      id: ids
    };

    return this._http.post(`${this._config.apiUrl}/viewed-notification`, body)
      .pipe(
        map(value => {
          this.bellCount$.next(this.bellCounter);
          this.chatCount$.next(this.chatCounter);
          return value;
        }));
  }
}

export interface Counter {
  my: CountersMy;
  client: Client;
  total: number;
}

export interface Client {
  incomingPortal: IncomingP;
  incomingPartner: IncomingP;
  placed: PlacedClass;
  confirmed: PlacedClass;
  total: number;
}

export interface PlacedClass {
  routes: ConfirmedCustoms;
  customs: ConfirmedCustoms;
  products: ConfirmedCustoms;
  total: number;
}

export interface ConfirmedCustoms {
  activities: CustomsElement[];
  total: number;
}

export interface CustomsElement {
  activityName?: number;
  total: number;
  portal: number;
  partner: number;
  activity?: number;
}

export interface IncomingP {
  routes: IncomingPartnerCustoms;
  customs: IncomingPartnerCustoms;
  products: IncomingPartnerProducts;
  total: number;
}

export interface IncomingPartnerCustoms {
  activities: CustomsActivity[];
  total: number;
}

export interface CustomsActivity {
  activity: number;
  activityName: number;
  total: number;
}

export interface IncomingPartnerProducts {
  activities: ProductsActivity[];
  total: number;
}

export interface ProductsActivity {
  activity: number;
  activityName: number;
  total: number;
}

export interface CountersMy {
  afterCalcPortal: PurpleAfterCalcP;
  afterCalcPartner: PurpleAfterCalcP;
  placed: Placed;
  confirmed: MyConfirmed;
  total: number;
}

export interface PurpleAfterCalcP {
  routes: AfterCalcPartnerCustoms;
  customs: AfterCalcPartnerCustoms;
  products: AfterCalcPartnerProducts;
  total: number;
}

export interface AfterCalcPartnerCustoms {
  total: number;
  totalProposal: number;
}

export interface AfterCalcPartnerProducts {
  total: number;
  totalProposal: number;
  orders: any;
}

export interface MyConfirmed {
  routes: CustomsElement;
  customs: CustomsElement;
  products: CustomsElement;
  total: number;
}

export interface Placed {
  routes: PurpleCustoms;
  customs: PurpleCustoms;
  products: PurpleCustoms;
  total: number;
}

export interface PurpleCustoms {
  awaitApprovalFromSupplier: number;
  awaitApprovalFromSuppliers: number;
  total: number;
}

export interface Total {
  my: TotalMy;
  client: Client;
  total: number;
}

export interface TotalMy {
  afterCalcPortal: FluffyAfterCalcP;
  afterCalcPartner: FluffyAfterCalcP;
  placed: Placed;
  confirmed: MyConfirmed;
  total: number;
}

export interface FluffyAfterCalcP {
  routes: AfterCalcPartnerCustoms;
  customs: AfterCalcPartnerCustoms;
  products: AfterCalcPartnerCustoms;
  total: number;
}

export interface TariffNotice {
  companyId?: number;
  activityNameId?: number;
  activityId?: number;
  price?: number;
  currency?: number;
}

export interface CreatedProductOrders {
  categoryId: number;
  categoryNameCn: string;
  categoryNameEn: string;
  categoryNameRu: string;
  orderId: number;
  total: number;
}

export interface Gift {
  amount: number;
  companyId: number;
  currency: any;
  id?: number;
}
