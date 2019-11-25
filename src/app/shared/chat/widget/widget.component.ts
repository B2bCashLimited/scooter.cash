import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ViewChild,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { WindowService } from '../services/window.service';
import { TranslateService } from '@ngx-translate/core';
import { actNameConverter } from '../models/activity.model';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';
import { BuyerSellerDialogComponent } from '../buyer-seller-dialog/buyer-seller-dialog.component';
import * as moment from 'moment';
import { isPlatformBrowser } from '@angular/common';
import { ActivityName, User } from '@b2b/models';
import { interval, Subject, Subscription } from 'rxjs';
import { ActivityNameService, ChatService, UserService } from '@b2b/services';
import { Activities } from '@b2b/constants';
import { getFromLocalStorage, removeFromLocalStorage } from '@b2b/helpers/utils';
import {
  ActivityCountrySelectDialogComponent
} from '@b2b/shared/popups/activity-country-select-dialog/activity-country-select-dialog.component';
import { ActivitySelectComponent } from '@b2b/shared/activity-select/activity-select.component';

@Component({
  selector: 'app-widget-chat',
  templateUrl: 'chat.component.html',
  styleUrls: ['chat.component.scss'],
  providers: [WindowService]
})
export class ChatWidgetModalComponent implements OnInit, OnDestroy {
  companyActivities = [
    Activities.CUSTOMS_BROKERS,
    Activities.CUSTOMS_WITHOUT_LICENSES,
    Activities.DOMESTIC_AIR_CARRIERS,
    Activities.DOMESTIC_RAIL_CARRIERS,
    Activities.DOMESTIC_TRUCKERS,
    Activities.INTERNATIONAL_AIR_CARRIERS,
    Activities.INTERNATIONAL_RAIL_CARRIERS,
    Activities.INTERNATIONAL_TRUCKERS,
    Activities.MANUFACTURERS,
    Activities.RIVER_CARRIERS,
    Activities.SEA_CARRIERS,
    Activities.SUPPLIERS,
    Activities.WAREHOUSES,
    Activities.WAREHOUSES_RENTS,
  ];
  @ViewChild(ActivitySelectComponent) selectActivityComponent: ActivitySelectComponent;
  private user;
  activity = '';
  actNameId = 0;    // айди вида деятельности - 1-12 (или как то так)
  activityId = 0;
  interval$;
  owner;
  chatType;
  actNameConverter = actNameConverter;
  mobile = 0;
  step = 0;
  activities: ActivityName[];
  readyToOpenSysChat = false;
  userCompany = this._userService.userCompany$.value;
  companyId: number = this.userCompany && +this.userCompany.id || null;

  private _actChooseDialogSub: Subscription;
  private _createSysChatSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private dialog: MatDialog,
    private chatService: ChatService,
    private _userService: UserService,
    private windowService: WindowService,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _activityNameService: ActivityNameService,
  ) {
  }

  ngOnDestroy(): void {
    this.chatService.hide.next(true);
    this.chatService.disconnect();
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => {
          this.userCompany = res;
          this.companyId = +this.userCompany.id;
        });
    }

    let selectedActivity: any;
    if (isPlatformBrowser(this.platformId)) {
      selectedActivity = getFromLocalStorage('B2B_ACTIVITY_SELECT');
    }
    if (selectedActivity && Object.keys(selectedActivity).length > 0) {
      const {activity, activityName} = selectedActivity;
      if (activity) {
        this.activity = activity.keyName;
        this.actNameId = activity.id;
      }
      if (activityName) {
        this.activityId = +activityName.id;
      }
    }
    this.getActivityNames();
    this.getOwner();
    this.getUser();
    this.getChatType();
    this.windowService.width$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((value: any) => {
        if (value < 768) {
          this.mobile = 1;
        } else {
          this.mobile = 0;
        }
      });
    const gbR = this.actNameConverter.find(field => field.path === this.activity || field.path2 === this.activity
      || field.dispatchE === this.activity || field.dispatchM === this.activity);
    if (gbR) {
      this.activity = gbR['dispatchE'];
    }

    this.chatService.step$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(val => this.step = val);

    this.interval$ = interval(this.chatService.createSysChatIntervalTime);
  }

  getOwner(): void {
    this.chatService.owner
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(owner => this.owner = owner);
  }

  getChatType(): void {
    let chatLS;
    if (isPlatformBrowser(this.platformId)) {
      chatLS = getFromLocalStorage('chat');
    }
    if (chatLS) {
      this.chatType = chatLS.section;
    }
    this.chatService.chatType
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(type => {
        this.chatType = type;

        if (+type === 1) {
          this.createSysChat();
        } else {
          this.readyToOpenSysChat = true;
        }
      });
  }

  createSysChat(): void {
    if (this._createSysChatSub && !this._createSysChatSub.closed) {
      this._createSysChatSub.unsubscribe();
    }

    const params: any = {
      userId: +this.user.id,
      companyId: this.companyId,
      actNameId: this.owner === 2 ? +this.actNameId : 0,
      isCustomer: this.owner === 2 ? 0 : 1
    };
    this._createSysChatSub = this.chatService.createSystemChat(params)
      .pipe(
        map((res) => {
          if (res && res.id) {
            this.readyToOpenSysChat = true;
            if (!this.chatService.banned.value) {
              this.chatService.openChat(res.id);
              this.chatService.clientConnected(res.id);
            }
          }
        }),
        catchError(() => {
          this.readyToOpenSysChat = true;
          if (!this.chatService.banned.value) {
            this.chatService.openChat(0);
          }
          return this.interval$
            .pipe(
              map(() => {
                if (!this.chatService.banned.value && this.chatType === 1) {
                  this.createSysChat();
                }
              })
            );
        })
      )
      .subscribe();
  }

  getUser(): void {
    this.user = this._userService.currentUser;
    this._userService.currentUser$
      .pipe(
        filter((user: User) => !!user),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((user: User) => {
        this.user = user;
        this.chatService.banned.next(user.bannedInChatTo && moment(user.bannedInChatTo.date).isAfter(moment()));
        this.chatService.disconnect(false);
        this.chatService.componentDidLoad(user);
      });
  }

  getActivityNames() {
    this._activityNameService.getActivityNames()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((activityNames: ActivityName[]) => this.activities = activityNames);
  }

  fdListener(evt): void {
    this.owner = 2;
    this.chatService.changeOwner(this.owner);
    this.companyId = +evt.activeCompany.id;
    const obj = {
      companyId: this.companyId,
      activityKey: this.owner === 2 ? evt.activity.keyName : '',
      activityId: this.owner === 2 ? +evt.activityName.id : 0
    };
    this.chatService.selectActivity(obj);
    this.activity = evt.activity.keyName;
    this.activityId = +evt.activityName.id;
  }

  initalState(): void {
    const obj = {
      companyId: 0,
      activityKey: '',
      activityId: 0
    };
    this.chatService.selectActivity(obj);
    this.companyId = 0;
    this.activity = '';
    this.activityId = 0;
    if (isPlatformBrowser(this.platformId)) {
      removeFromLocalStorage('B2B_ACTIVITY_SELECT');
    }
  }

  activitySwitch() {
    const dialog = this.dialog.open(ActivityCountrySelectDialogComponent);
    if (this._actChooseDialogSub && !this._actChooseDialogSub.closed) {
      this._actChooseDialogSub.unsubscribe();
    }
    this._actChooseDialogSub = dialog.afterClosed()
      .subscribe((value: {
        selectedActivity: {
          companyId: number,
          activityKey: string,
          activityId: number
        },
        actNameId: number
      }) => {
        if (value) {
          this.chatService.selectActivity(value.selectedActivity);
        }
      });
  }
}

@Component({
  selector: 'app-chat-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  active = true;
  user: any;
  userCompany = this._userService.userCompany$.value;

  private _actSelDialSub: Subscription;
  private _buyerSellerDialSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _route: ActivatedRoute,
    private _matDialog: MatDialog,
    private _userService: UserService,
    private _translateService: TranslateService,
    private chatService: ChatService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (this._route.snapshot.routeConfig.component.name === 'ChatComponent') {
      this.active = false;
    }
    this.getUser();

    if (this.userCompany) {
      this.active = true;
    } else {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(value => this.active = !!value);
    }
  }

  getUser(): void {
    this._userService.currentUser$
      .pipe(
        filter((user: User) => !!user),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((user: User) => {
        this.user = user;
        if (!this.user || this.user.id === 0) {
          this.active = false;
        }
      });
  }

  open(): void {
    if (this.user && this.user.id) {
      this.openBuyerSellerDialog();
    }
  }

  openChatDialog(owner: number, chatType: number = 1) {
    this.chatService.changeOwner(owner);
    this.chatService.setChatType(chatType);
    this._matDialog.open(ChatWidgetModalComponent, {
      panelClass: 'chat__widget',
    });
  }

  openBuyerSellerDialog(): void {
    if (this._buyerSellerDialSub && !this._buyerSellerDialSub.closed) {
      this._buyerSellerDialSub.unsubscribe();
    }

    this._buyerSellerDialSub = this._matDialog.open(BuyerSellerDialogComponent)
      .afterClosed()
      .subscribe(res => {
        if (res === 'seller') {
          this.openActivityCountrySelectDialog();
        } else if (res === 'buyer') {
          this.openChatDialog(1);
        }
      });
  }

  openActivityCountrySelectDialog() {
    if (this._actSelDialSub && !this._actSelDialSub.closed) {
      this._actSelDialSub.unsubscribe();
    }

    this._actSelDialSub = this._matDialog.open(ActivityCountrySelectDialogComponent)
      .afterClosed()
      .pipe(filter(res => !!res))
      .subscribe(() => this.openChatDialog(2));
  }
}
