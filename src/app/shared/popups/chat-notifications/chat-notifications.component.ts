import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { ActivityName, Notification, Relations } from '@b2b/models';
import { ActivityNameService, ChatService, ConfigService, CountersService, UserService } from '@b2b/services';
import { removeFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';
import { takeUntil } from 'rxjs/operators';
import { ChatWidgetModalComponent } from '@b2b/shared/chat/widget/widget.component';

@Component({
  selector: 'app-chat-notifications',
  templateUrl: './chat-notifications.component.html',
  styleUrls: ['./chat-notifications.component.scss']
})
export class ChatNotificationsComponent implements OnInit, OnDestroy {

  activityNames: ActivityName[];
  userCompany = this.userService.userCompany$.value;

  private _actNameSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public counter: CountersService,
    public config: ConfigService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private activityNameService: ActivityNameService,
    private userService: UserService,
    private router: Router,
    private translate: TranslateService,
    private _matSnackBar: MatSnackBar,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();

    if (this.counter.newSystemChatsClosed.length) {
      this.counter.viewNotification(this.counter.newSystemChatsClosed).subscribe();   // "просматриваем" закрытые сис чаты
    }
  }

  ngOnInit(): void {
    this._actNameSub = this.activityNameService.activityNames$.subscribe(value => this.activityNames = value);

    if (!this.userCompany) {
      this.userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => this.userCompany = res);
    }
  }

  openChat(note: Notification) {
    if (!note.attributes || !note.attributes.message || !note.attributes.message.attributes || !note.attributes.message.attributes.chat) {
      return; // проверка на внезапно отсутствующие данные
    }
    console.log('Current Notes: ', this.counter.notifications);
    const chat = note.attributes.message.attributes.chat;
    let obj: any;

    if (!note.attributes.message.activityId) {
      this.chatService.changeOwner(2);
      const relations: Relations[] = chat.relations;
      let me: Relations;

      if (relations && relations.length) {
        me = relations.find(relation => +relation.userId === +this.userService.currentUser.id);
      }
      if (this.activityNames) {
        const activityName = this.activityNames.find(value => value.keyName === me.activityKey);
        const activity = this.userCompany[activityName.embeddedName].find(value => +value.id === +me.activityId);
        const result: any = {
          activityName: activity,
          activeCompany: this.userCompany,
          activity: activityName
        };

        obj = {
          companyId: +this.userCompany.id,
          activityKey: activityName.keyName,
          activityId: +activity.id
        };

        if (result.activityName && result.activeCompany && result.activity) {
          if (isPlatformBrowser(this.platformId)) {
            removeFromLocalStorage('B2B_ACTIVITY_SELECT');
            setToLocalStorage('B2B_ACTIVITY_SELECT', result);
          }
        }
      }
    } else {
      this.chatService.changeOwner(1);
    }

    this.chatService.setChatType(chat.chatType);

    if (this.router.url !== '/chat') {
      this.dialog.open(ChatWidgetModalComponent, {
        panelClass: 'chat__widget',
      });
      this.chatService.openChat(+chat.id);
      this.counter.viewChatNotificationsByChatId(+chat.id).subscribe();
    } else if (obj) {
      this.chatService.selectActivity(obj);
      this.chatService.openChat(+chat.id);
      this.counter.viewChatNotificationsByChatId(+chat.id).subscribe();
    } else {
      this._matSnackBar.open(this.translate.instant('chat.errorTryLater'), 'OK', {duration: 3000});
    }
  }
}
