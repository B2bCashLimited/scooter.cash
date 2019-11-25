import {
  Component,
  OnInit,
  Inject,
  OnDestroy
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA, MatSnackBar
} from '@angular/material';
import { NO_LOGO_URL } from '../models/activity.model';
import { ChatService, ConfigService } from '@b2b/services';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-popup-info',
  templateUrl: './info-chat.component.html',
  styleUrls: ['./info-chat.component.scss']
})
export class ChatInfoComponent implements OnInit, OnDestroy {
  chat: any;
  activities;
  userId: number;
  readonly OCCUPATION_CLASS = {
    supplier: 'bb bb-provider',
    manufacturer: 'bb bb-manufactory',
    customsWithoutLicense: 'bb bb-customs',
    customsBroker: 'bb bb-customs-license',
    domesticTrucker: 'bb bb-lorry-country',
    domesticRailCarrier: 'bb bb-rails-country',
    domesticAirCarrier: 'bb bb-plane-country',
    internationalTrucker: 'bb bb-lorry-world',
    internationalRailCarrier: 'bb bb-rails-world',
    seaCarrier: 'bb bb-ship-sea',
    internationalAirCarrier: 'bb bb-plane-world',
    riverCarrier: 'bb bb-ship-river',
    warehouseRent: 'bb bb-warehouse-rent',
    warehouse: 'bb bb-warehouse-security'
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _config: ConfigService,
    private _matDialog: MatDialog,
    private _matDialogRef: MatDialogRef<ChatInfoComponent>,
    private _translate: TranslateService,
    private _chatService: ChatService,
    private _matSnackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.chat = this.data.chat;
    this.activities = this.data.activities;
    this.userId = +this.data.user.id;
  }

  activityName(keyName) {
    if (keyName) {
      let keyActivity = keyName.replace(/s\s*$/, '');
      if (keyActivity === 'warehousesRent') {
        keyActivity = 'warehouseRent';
      }
      if (keyName && this.activities) {
        const activity = this.activities.find(value => value.keyName === keyActivity);
        if (activity) {
          return activity ? activity['name' + this._config.locale] : '';
        }
      }
    }
  }

  getCompanyLogoUrl(companyLogo: any): string {
    let logoUrl = NO_LOGO_URL;
    if (companyLogo.length) {
      logoUrl = this._config.serverUrl + companyLogo[0].link;
    }
    return logoUrl;
  }

  isAdmin(userId: number): boolean {
    const curUser = this.chat.relations.find(relation => +relation.userId === userId);
    if (curUser) {
      return curUser.owner;
    }
    return false;
  }

  fixActivity(activities) {
    let activity: string;
    if (activities) {
      activity = activities;
      activity = activity.replace(/s\s*$/, '');
    }
    if (activity === 'warehousesRent') {
      activity = 'warehouseRent';
    }
    return activity ? activity : activities;
  }

  close(): void {
    this._matDialogRef.close();
  }

  delete(chat_id: number, relation_id: number): void {

    this._chatService.deleteFromGroup(chat_id, relation_id)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => {
        this.chat.relations = this.chat.relations.filter(item => item.id !== relation_id);
        this._chatService.contactsUpdate({chatId: chat_id});
      }, () => this._matSnackBar.open(this._translate.instant('chat.errorTryLater'), 'OK', {duration: 3000}));
  }
}
