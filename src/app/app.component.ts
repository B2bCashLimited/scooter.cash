import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Injector, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { environment } from '@b2b/environments/environment';
import { ChatService, ConfigService, CountersService, SeoService, SocketService, UserService } from '@b2b/services';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { getFromLocalStorage, removeFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';
import { User, Notification } from '@b2b/models';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatedProductOrders } from './core/services/counters.service';
import { NotificationTypes } from '@b2b/constants';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  userCompany = this._userService.userCompany$.value;
  hostName = environment.production ? location.hostname : 'scooter.cash';

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _injector: Injector,
    private _translateService: TranslateService,
    private _config: ConfigService,
    private _userService: UserService,
    private _seo: SeoService,
    private _socketService: SocketService,
    private _countersService: CountersService,
    private _chatService: ChatService,
    private _router: Router,
    private _route: ActivatedRoute,
  ) {
    this.getLoggedUser();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();

    if (this._socketService && typeof this._socketService.disconnect === 'function') {
      this._socketService.disconnect();
    }

    if (isPlatformBrowser(this.platformId)) {
      removeFromLocalStorage('UTM');
    }
  }

  ngOnInit(): void {
    this._translateService.setDefaultLang(environment.defaultLanguage);
    this._config.locale = this._translateService.getDefaultLang();
    this._subToSeoTagsUpdates();
    this._seo.setMainTitleAndDescription();

    this._route.queryParamMap
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: any) => {
        const queryParams: any = {};

        for (const key in res.params) {
          if (res.params.hasOwnProperty(key)) {
            if (key.includes('utm')) {
              queryParams[key] = this._route.snapshot.queryParamMap['params'][key];
            }
          }
        }

        if (Object.keys(queryParams).length > 0 && isPlatformBrowser(this.platformId)) {
          setToLocalStorage('UTM', JSON.stringify(queryParams));
        }
      });

    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => this.userCompany = res);
    }

    this._translateService.onLangChange
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: LangChangeEvent) => {
        this._config.locale = res.lang || environment.defaultLanguage;
      });

    this._userService.getUserDataByDomain(this.hostName)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this._userService.domainData$.next(res));

    this._userService.getGeoDataByIp()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe();

    this._userService.currentUser$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(user => {
        if (user && user.id) {
          this._socketService.connect(user.id);
          this._socketService.on('order_counters_updated', (res: any) => {
            if (res.companies) {
              this._countersService.counters = res;
              this._countersService.bellCount$.next(this._countersService.bellCounter);
            }
          });
          this._socketService.onProductOrderCreated((res: CreatedProductOrders) => {
            if (res) {
              this._countersService.getNewOrdersNotifications(this.userCompany)
                .pipe(takeUntil(this._unsubscribe$))
                .subscribe();
            }
          });
          this._socketService.on('new_notification', (res: {chatId: number, notification: Notification}) => {
            if (res.notification) {
              if (res.notification.type !== NotificationTypes.NEW_MESSAGE || (res.notification.type === NotificationTypes.NEW_MESSAGE &&
                // не сохраняем, если сейчас находимся в этом чате
                +this._chatService.currentChatId.value !== +res.notification.attributes.chatId)) {
                this._countersService.notifications.push(res.notification);
              } else {
                this._countersService.viewNotification(+res.notification.id)
                  .pipe(takeUntil(this._unsubscribe$))
                  .subscribe();
              }
              this._countersService.bellCount$.next(this._countersService.bellCounter);
              this._countersService.chatCount$.next(this._countersService.chatCounter);
            }
          });
          this._countersService.getOrderCounters(user.id).subscribe();
          this._countersService.getGlobalNotifications(user.id).subscribe();
          this._socketService.onUserStatusUpdated(socket => {
            this._userService.currentUser.status = socket.status;
            this.getLoggedUser();
            this._router.navigate(['profile'])
              .catch((err) => console.log(err));
          });
          this._socketService.onClientBanned(() => this.getLoggedUser());
        }
      });
  }

  /**
   * Retrieve logged user to get user related options
   */
  private getLoggedUser(): void {
    if (isPlatformBrowser(this.platformId) && getFromLocalStorage('B2B_AUTH')) {
      const userId = getFromLocalStorage('B2B_USER_ID');
      this._userService.getUserById(userId)
        .pipe(
          filter((user: User) => !!user),
          takeUntil(this._unsubscribe$)
        )
        .subscribe((user: User) => {
          const userCompanies = user._embedded.companies && (user._embedded.companies as any[]).length > 0;
          this._userService.currentUser = user;
          this._userService.userCompany$.next(userCompanies && user._embedded.companies[0] || null);
          if (isPlatformBrowser(this.platformId)) {
            setToLocalStorage('B2B_ACTIVE_COMPANY_ID', +userCompanies && user._embedded.companies[0].id || null);
          }
        });
    }
  }

  private _subToSeoTagsUpdates(): void {
    this._seo.title$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setTitle(value));

    this._seo.description$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setDescription(value));

    this._seo.keywords$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setKeywords(value));
  }
}
