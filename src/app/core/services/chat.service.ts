import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UserService } from './user.service';
import { ConfigService } from './config.service';
import { getFromLocalStorage, removeEmptyProperties } from '@b2b/helpers/utils';
import { Contacts, Create, RelationsAddToGroup, SelectedActivity } from '@b2b/models';
import { ChatMessageTypes } from '@b2b/constants';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  userId;
  user;
  activityChanged = new BehaviorSubject<SelectedActivity>({
    companyId: 0,
    activityKey: '',
    activityId: 0
  });
  createSysChatIntervalTime = 5000;
  contactsLimit = 10;
  messagesLimit = 20;
  companiesLimit = 10;
  currentChatId = new BehaviorSubject<any>(0);
  currentChatLogo: string;
  contacts = new Subject<any>(); // замена для всех обновлений контактов
  owner: BehaviorSubject<any>;
  read = new Subject<any>(); // Виндоу меняет стили в зав-ти от этого (видимо прочит - непрочит сообщения)
  newMessage = new Subject<any>(); // 1 некст тут и 1 подписка в виндоу
  chatType: BehaviorSubject<any>;           // 1 некст тут, 6 подписок в 4 местах - оставим?
  stop = new Subject<any>(); // подписка в чатКОмпонент, 2 тут в компонентДидЛоад
  hide = new Subject<any>(); // чатКомпонент онДестрой (тру), Виджет онДестрой (тру)
  step$ = new BehaviorSubject(1); // 2 подписки и 1 next тут :732 (3 исп) - переходы в мобил режим
  chatAutoclosed = new Subject<any>();
  banned = new BehaviorSubject(false);

  constructor(
    private _http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any,
    private _usersService: UserService,
    private _config: ConfigService,
    private socket: SocketService,
  ) {
    if (isPlatformBrowser(platformId)) {
      this.owner = new BehaviorSubject<any>(getFromLocalStorage('chat') ? +getFromLocalStorage('chat')['owner'] : 1);
      this.chatType = new BehaviorSubject<any>(getFromLocalStorage('chat') ? +getFromLocalStorage('chat')['section'] : 1);
    }
  }

  getHistory(chat_id, page) {
    return this._http.get(`${this._config.chatUrl}/chat/${chat_id}/messages?page=${page}&per_page=${this.messagesLimit}`)
      .pipe(map(value => value['data']));
  }

  getContacts1(params: Contacts): Observable<any> {
    let url_params: {
      userId: number,
      page?: number,
      limit?: number,
      myCompany: number,
      myActivity?: string,
      myActivityId?: number,
      type?: number,
      search?: string,
      owner?: number,
      activity?: string
    };
    url_params = {
      page: params.page || 1,
      limit: params.limit || this.contactsLimit,
      userId: this.userId,
      myCompany: params.myCompany,
      owner: params.owner,
      type: params.type,
      search: params.query || null,
      activity: params.categoryName ? params.categoryName : null,
      myActivityId: params.owner === 2 ? params.activitySubId : null,
      myActivity: params.owner === 2 ? params.myActivity : null
    };

    return this._http.get(`${this._config.apiUrl}/chat-get`, {params: removeEmptyProperties(url_params)});
  }

  addToGroup(relations: RelationsAddToGroup[], chat_id: number, name: string): Observable<any> {        // только в групЧат - туда и вынести
    const params = {
      chat: {
        name: name // если надо переименовать чат, если нет то "chat" не отправляем.
      },
      relations: relations
    };

    return this._http.post(`${this._config.apiUrl}/chat-relation-add`, params)
      .pipe(switchMap(value => this._http.get(`${this._config.apiUrl}/chat/${chat_id}`)));
  }

  deleteFromGroup(chat_id: number,
                  relation_id: number): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/chat-relation-delete`,
      {
        id: relation_id
      }
    ).pipe(switchMap(value => this._http.get(`${this._config.apiUrl}/chat/${chat_id}`)));
  }

  create(options: Create): Observable<any> { // создание чата по 2 использования из НьюЧат и ГрупЧата
    return this._http.post(`${this._config.apiUrl}/chat-group-add`, options)
      .pipe(
        map(res => {
          this.socket.emitChatCreate({
            chat_id: res['id'],
            activities: this.transistCA()
          });
          return res;
        }));
  }

  createSystemChat(params: {
    userId: number,
    companyId: number,
    actNameId: number,
    isCustomer: number
  }): Observable<any> {
    const body: {
      userId: number,
      companyId: number,
      activity: number,
      isCustomer: number
    } = {
      userId: params.userId,
      companyId: params.companyId,
      activity: params.actNameId,
      isCustomer: params.isCustomer
    };
    return this._http.post(`${this._config.apiUrl}/chat-create`, body);
  }

  send(chat_id: number, text: string, type: string = ChatMessageTypes.TYPE_USER, attributes?: string) {
    this.socket.emitMessage({
      chat_id: chat_id,
      text: text,
      activities: this.transistCA(),
      type: type || null,
      attributes: attributes || null
    });
    this.socket.emitChatActivity({chat_id: chat_id, activities: this.transistCA()});
  }

  getCompaniesByCategory(
    page: number,
    query: string = '',
    category: string = ''
  ): Observable<any> {

    let params = {};
    if (query) {
      params = {
        'page': page,
        'limit': this.companiesLimit,
        'filter[0][type]': 'lowerlike',
        'filter[0][field]': 'name',
        'filter[0][value]': '%' + query + '%',
        'filter[1][type]': 'innerjoin',
        'filter[1][field]': 'company',
        'filter[1][alias]': 'comp'
      };
    } else {
      params = {
        'page': page,
        'limit': this.companiesLimit
      };
    }

    return this._http.get(`${this._config.apiUrl}/${category}`, {params: params});
  }

  getPartners(page,
              owner: number,
              companyId: number = 0,
              activityKey: string = '',
              activityId: number = 0,
              query: string = ''
  ): Observable<any> {

    let params = {};
    if (+owner === 1) {
      params = {
        'page': page,
        'limit': this.companiesLimit,
        'filter[0][type]': 'eq',
        'filter[0][field]': 'company',
        'filter[0][value]': companyId,
        'filter[1][type]': 'isnotnull',
        'filter[1][field]': activityKey,
        'filter[2][type]': 'innerjoin',
        'filter[2][field]': activityKey,
        'filter[2][alias]': 'act',
        'filter[3][type]': 'lowerlike',
        'filter[3][field]': 'name',
        'filter[3][alias]': 'act',
        'filter[3][value]': (query ? `%${query}%` : '%'),
        'filter[4][type]': 'eq',
        'filter[4][field]': 'status',
        'filter[4][value]': '1'
      };
    } else {
      params = {
        'page': page,
        'limit': this.companiesLimit,
        'filter[0][type]': 'eq',
        'filter[0][field]': 'partner',
        'filter[0][value]': companyId,
        'filter[1][type]': 'eq',
        'filter[1][field]': activityKey,
        'filter[1][value]': activityId,
        'filter[2][type]': 'innerjoin',
        'filter[2][field]': 'company',
        'filter[2][alias]': 'comp',
        'filter[3][type]': 'lowerlike',
        'filter[3][field]': 'name',
        'filter[3][alias]': 'comp',
        'filter[3][value]': (query ? `%${query}%` : '%'),
        'filter[4][type]': 'eq',
        'filter[4][field]': 'status',
        'filter[4][value]': '1'
      };
    }
    return this._http.get(`${this._config.apiUrl}/partnership`, {params: params});
  }

  getAllCompanies(
    page: number,
    query: string = '',
    categoryId: any = ''
  ): Observable<any> {

    let params = {};
    if (query) {
      params = {
        'page': page,
        'limit': 10,
        'filter[0][type]': 'lowerlike',
        'filter[0][field]': 'name',
        'filter[0][value]': `%${query}%`
      };
    } else {
      params = {
        'page': page,
        'limit': 10
      };
    }
    return this._http.get(`${this._config.apiUrl}/companies`, {params: params});
  }

  selectActivity(data: SelectedActivity): void {
    this.activityChanged.next(data);
    this.destroyWindow();
  }

  componentDidLoad(user): void { // чатКомп и ВИджет
    this.user = user;
    this.userId = +user.id;
    this.socket.connect(+user.id);
    this.socket.onNewMessage(socket => {
      // console.log('On New Message', socket);
      this.newMessage.next(socket);
    });
    this.socket.onRelationActivity(socket => {
      this.read.next(socket);
    });
    this.socket.onOnline(socket => {
      // this.activity.next({type: 1, user_id: socket.user_id});
      // console.log('SOCKET: online: ', socket);
    });
    this.socket.onOffline(socket => {
      // this.activity.next({type: 2, user_id: socket.user_id});
      // console.log('SOCKET: offline: ', socket);
    });

    this.socket.onConsultantDisconnected(socket => {
      if (this.currentChatId.value === socket.id) {
        // this.chatAutoclosed.next(1);
      }
    });

    this.socket.onChatClosedByTO(data => {
      // console.log(`Socket: onChatClosedByTO`, data, this.currentChatId.value);
      if (+data.id === +this.currentChatId.value) {
        // this.openChat(0);
        this.chatAutoclosed.next(1);
      }
      // this.contactsUpdate(data);
    });

    /*this.socket.onClientBanned(socket => {
      console.log(`Socket: onClientBanned`, socket);
      this.banned.next(true);
    });*/

    this.socket.onChatUpdate(data => {
      // console.log('SOCKET: Chat update ', data);
      const transist = this.transistCA();
      const companyId = transist['companyId'] ? transist['companyId'] : 0;
      const activityKey = transist['activityKey'] ? transist['activityKey'] : '';
      const activityId = transist['activityId'] ? transist['activityId'] : 0;
      if (activityId) {
        if (+data.company_id === +companyId &&
          data.activityKey === activityKey &&
          +data.activityId === +activityId
        ) {
          this.contactsUpdate(data);
        }
      } else {
        if (+data.company_id === +companyId) {
          this.contactsUpdate(data);
        }
      }
    });
    this.socket.onConnect(data => {
      this.stop.next(2);
      // console.log('SOCKET: connect: ', data);
    });

    this.socket.onDisconnect(data => {
      // console.log('SOCKET: disconnect: ', data);
      if (!this.hide) {
        this.stop.next(1);
      }
    });
  }

  countUnread(id, chat_id, status = 3): void {
    this.socket.emitStatus({chat_id: chat_id, id: id, status: status, activities: this.transistCA()});
  }

  focusChat(chat_id: number): void {
    this.socket.emitChatActivity({chat_id: chat_id, activities: this.transistCA()});
  }

  rateConsultant(chatId: number, rate: number) {
    this.socket.emitConsultantRated({
      chat_id: chatId,
      rate: rate
    });
  }

  clientClosedQuestion(chatId: number) {
    this.socket.emitClientCloseQuestion({
      chat_id: chatId // идентификатор чата
    });
  }

  clientConnected(chatId?: number) {
    this.socket.emitClientConnected({chat_id: chatId});
  }

  clientOpenedWindow(chatId: number) {
    this.socket.emitClientOpenWindow({chat_id: chatId});
  }

  clientClosedWindow(chatId: number) {
    this.socket.emitClientCloseWindow({chat_id: chatId});
  }

  clientDisconnected(chatId?: number) {
    this.socket.emitClientDisconnect({chat_id: chatId});
  }

  transistCA(): SelectedActivity {
    let obj;
    let owner;
    let res: SelectedActivity;
    if (isPlatformBrowser(this.platformId)) {
      obj = getFromLocalStorage('B2B_ACTIVITY_SELECT');
      owner = getFromLocalStorage('chat') ? getFromLocalStorage('chat')['owner'] : 1;
      res = {
        companyId: +getFromLocalStorage('B2B_ACTIVE_COMPANY_ID'),
        activityKey: '',
        activityId: 0
      };
    }
    if (obj && owner === 2) {
      const companyId = +obj.activeCompany.id;
      let activityKey = '';
      if (obj.activity) {
        activityKey = obj.activity.keyName;
      }
      let activityId = 0;
      if (obj.activityName) {
        activityId = obj.activityName.id;
      }
      res = {
        companyId: companyId,
        activityKey: activityKey,
        activityId: activityId
      };
    }
    return res;
  }

  getChat(chatId): Observable<any> {
    return this._http.get(`${this._config.apiUrl}/chat/${chatId}`);
  }

  getMessages(chatId): Observable<any> {
    return this._http.get(`${this._config.chatUrl}/chat/${chatId}/messages?page=1&per_page=${this.messagesLimit}`);
  }

  openChat(chatId: number): void {
    // console.log('Open new chat ', chatId);
    this.setMobileDependency(2);
    if (chatId) {
      this.socket.emitChatActivity({chat_id: chatId, activities: this.transistCA()});
    }
    this.currentChatId.next(chatId);
  }

  deleteChat(chatId): Observable<any> {
    const body = {
      deleted: 1
    };
    return this._http.put(`${this._config.apiUrl}/chat/${chatId}`, body);
  }

  changeOwner(owner: any) { // 6 юзаджей везде
    this.owner.next(owner);
    this.destroyWindow();
  }

  destroyWindow() { // 7 использований
    this.openChat(0);
  }

  contactsUpdate(newContacts?: any): void { // из group-chat в контактс (1 подписка)
    this.contacts.next(newContacts ? newContacts : null);
  }

  disconnect(zeroChat = true) { // онДестрой в ЧатКомп и Виджет
    if (zeroChat) {
      this.openChat(0);
    }
    this.socket.offAllChat();
    this.clientDisconnected();
  }

  setChatType(type: any = 1) { // 2 - 1 Контактс и 1 Виндоу
    this.chatType.next(type);
  }

  setMobileDependency(step) {
    this.step$.next(step);
  }
}
