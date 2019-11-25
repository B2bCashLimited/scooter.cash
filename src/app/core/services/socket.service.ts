import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { ConfigService } from './config.service';
import { SelectedActivity } from '@b2b/models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket;
  private currentUserId: number;
  readonly SOCKET_EVENTS_CHAT = {
    newMessage: 'new message',
    relationActivity: 'relation activity',
    online: 'online',
    offline: 'offline',
    chatUpdate: 'chat update',
    connect: 'connect',
    disconnect: 'disconnect',
    status: 'status',
    chatActivity: 'chat activity',
    chatCreate: 'chat create',
    message: 'message',
    consultantRated: 'consultant_rated',
    clientRatedYou: 'client_rated_you',
    clientOpenWindow: 'client_open_window',
    clientOpenedWindow: 'client_opened_window',
    clientCloseWindow: 'client_close_window',
    clientClosedWindow: 'client_closed_window',
    clientCloseQuestion: 'client_close_question',
    clientClosedQuestion: 'client_closed_question',
    clientDisconnect: 'client_disconnect',
    clientDisconnected: 'client_disconnected',
    clientConnect: 'client_connect',
    clientConnected: 'client_connected',
    consultantDisconnected: 'consultant_disconnected',
    chatClosedByTO: 'chat_closed_by_timeout',
  };

  readonly SOCKET_EVENTS_APP = {
    user_status_updated: 'user_status_updated',
    clientBanned: 'client_banned',
    PRODUCT_STATUS_UPDATED: 'product_status_updated',
    order_counters_update: 'order_counters_update',
    new_partner: 'new_partner',
    partnership_approved: 'partnership_approved',
    partnership_canceled: 'partnership_canceled',
    partnership_broke_up: 'partnership_broke_up',
    new_employee: 'new_employee',
    tariff_client_update: 'tariff_client_update',
    tariff_product_update: 'tariff_product_update',
    tariff_custom_route_update: 'tariff_custom_route_update',
    PRODUCT_ORDER_CREATE: 'product_order_create',
    PRODUCT_ORDER_CREATED: 'product_order_created',
  };

  get isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  constructor(private _config: ConfigService) {
  }

  connect(userId: number = 0): void {
    if (!this.socket || !this.socket.isConnected) {
      this.currentUserId = +userId;
      this.socket = io.connect(`${this._config.chatUrl}?id=${userId}`, {secure: true, transports: ['websocket']});
    }
  }

  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback): void {
    // console.log(`SOCKET ON ${event}`);
    this.socket.on(event, callback);
  }

  // to remove events
  off(event: string): void {
    this.socket.off(event);
  }

  offAllChat() {
    if (this.socket) {
      Object.keys(this.SOCKET_EVENTS_CHAT).map(value => this.socket.off(this.SOCKET_EVENTS_CHAT[value]));
    }
  }

  emit(event: string, data: any): void {
    // console.log(`SOCKET EMIT ${event}`, data, this.socket);
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      this.connect(this.currentUserId);
      setTimeout(() => {
        this.emit(event, data);
      }, 5000);
    }
  }

  onNewMessage(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.newMessage, callback);
  }

  onRelationActivity(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.relationActivity, callback);
  }

  onOnline(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.online, callback);
  }

  onOffline(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.offline, callback);
  }

  onChatUpdate(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.chatUpdate, callback);
  }

  onConnect(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.connect, callback);
  }

  onDisconnect(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.disconnect, callback);
  }

  onClientRatedYou(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientRatedYou, callback);
  }

  onClientOpenedWindow(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientOpenedWindow, callback);
  }

  onClientClosedWindow(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientClosedWindow, callback);
  }

  onClientClosedQuestion(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientClosedQuestion, callback);
  }

  onClientDisconnected(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientDisconnected, callback);
  }

  onClientConnected(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.clientConnected, callback);
  }

  onConsultantDisconnected(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.consultantDisconnected, callback);
  }

  onChatClosedByTO(callback): void {
    this.on(this.SOCKET_EVENTS_CHAT.chatClosedByTO, callback);
  }

  onClientBanned(callback): void {
    this.on(this.SOCKET_EVENTS_APP.clientBanned, callback);
  }

  onUserStatusUpdated(callback): void {
    this.on(this.SOCKET_EVENTS_APP.user_status_updated, callback);
  }

  onProductOrderCreated(callback): void {
    this.on(this.SOCKET_EVENTS_APP.PRODUCT_ORDER_CREATED, callback);
  }

  emitStatus(data: {
    chat_id: number,
    id: number,
    status: number,
    activities: SelectedActivity
  }): void {
    this.emit(this.SOCKET_EVENTS_CHAT.status, data);
  }

  emitChatActivity(data: {
    chat_id: number,
    activities: SelectedActivity
  }): void {
    this.emit(this.SOCKET_EVENTS_CHAT.chatActivity, data);
  }

  emitChatCreate(data: {
    chat_id: number,
    activities: SelectedActivity
  }): void {
    this.emit(this.SOCKET_EVENTS_CHAT.chatCreate, data);
  }

  emitMessage(data: {
    chat_id: number,
    text: string,
    activities: SelectedActivity,
    type?: string,
    attributes?: string
  }): void {
    // console.log('Emit Message', data);
    this.emit(this.SOCKET_EVENTS_CHAT.message, data);
  }

  emitConsultantRated(data: {
    chat_id: number,    // идентификатор чата
    rate: number        // оценка
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.consultantRated, data);
  }

  emitClientOpenWindow(data: {
    chat_id: number     // идентификатор чата
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.clientOpenWindow, data);
  }

  emitClientCloseWindow(data: {
    chat_id: number     // идентификатор чата
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.clientCloseWindow, data);
  }

  emitClientCloseQuestion(data: {
    chat_id: number     // идентификатор чата
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.clientCloseQuestion, data);
  }

  emitClientDisconnect(data: {
    chat_id: number     // идентификатор чата
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.clientDisconnect, data);
  }

  emitClientConnected(data: {
    chat_id: number     // идентификатор чата
  }) {
    this.emit(this.SOCKET_EVENTS_CHAT.clientConnected, data);
  }

  emitRecipientCounter(recipient: number, type: 'product' | 'route' | 'custom', companyId: number) {
    this.emit(this.SOCKET_EVENTS_APP.order_counters_update, {recipient, type, companyId});
  }

  emitNewPartner(companyId: number, author_companyId: number, info: any) {
    const data = {
      company: companyId,
      author_company: author_companyId,
      info: info
    };
    this.emit(this.SOCKET_EVENTS_APP.new_partner, data);
  }

  emitPartnershipApproved(companyId: number, author_companyId: number, info?: any) {
    const data = {
      company: companyId,
      author_company: author_companyId,
      info: info
    };
    this.emit(this.SOCKET_EVENTS_APP.partnership_approved, data);
  }

  emitPartnershipCanceled(companyId: number, author_companyId: number, info?: any) {
    const data = {
      company: companyId,
      author_company: author_companyId,
      info: info
    };
    this.emit(this.SOCKET_EVENTS_APP.partnership_canceled, data);
  }

  emitPartnershipBrokeUp(companyId: number, author_companyId: number, info?: any) {
    const data = {
      company: companyId,
      author_company: author_companyId,
      info: info
    };
    this.emit(this.SOCKET_EVENTS_APP.partnership_broke_up, data);
  }

  emitNewEmployee(companyId: number, employee: any) {
    const data = {
      company: companyId,
      employee: employee,
    };
    this.emit(this.SOCKET_EVENTS_APP.new_employee, data);
  }

  emitProductTariff(companyId: number, activityNameId: number, activityId: number) {
    this.emit(this.SOCKET_EVENTS_APP.tariff_product_update, {companyId, activityNameId, activityId});
  }

  emitClientTariff(companyId: number) {
    this.emit(this.SOCKET_EVENTS_APP.tariff_client_update, {companyId});
  }

  emitCustomRouteTariff(companyId: number, activityNameId: number, activityId: number) {
    this.emit(this.SOCKET_EVENTS_APP.tariff_custom_route_update, {companyId, activityNameId, activityId});
  }

  emitProductOrderCreate(id: number): void {
    this.emit(this.SOCKET_EVENTS_APP.PRODUCT_ORDER_CREATE, {id});
  }
}
