import {
  Component,
  ViewChild,
  OnInit,
  Input,
  ElementRef,
  HostListener,
  OnDestroy,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
} from '@angular/material';
import { ChatNewComponent } from '../new-chat/new-chat.component';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap, takeUntil
} from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { actNameConverter, NO_LOGO_URL } from '../models/activity.model';
import { isPlatformBrowser } from '@angular/common';
import { ActivityName, Contacts, SelectedActivity, User } from '@b2b/models';
import { Subject } from 'rxjs';
import { ChatService, ConfigService, UserService } from '@b2b/services';
import { getFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';
import * as moment from 'moment';

@Component({
  selector: 'app-chat-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
})
export class ChatContactsComponent implements OnInit, OnDestroy {

  @ViewChild('ListCollection') ListCollection: ElementRef;
  @ViewChild('ListContainer') ListContainer: ElementRef;
  @Input() companyId = 0;
  @Input() activityKey = '';
  @Input() activityId = 0;
  @Input() activities: ActivityName[] = [];
  @Output() activitySwitch = new EventEmitter<void>();

  currentActivity: any;
  filtered: Contacts[] = [];
  section = 3;
  activeCategoryName = '';
  dimensions = {
    ListCollection: 0,
    ListContainer: 0
  };
  loading = true;
  searchInput = new FormControl();
  emptyList = true;
  totalItems = 0;
  page = 1;
  newDialogChatRef: MatDialogRef<ChatNewComponent>;
  owner = 1;
  user: any;
  companyLogoUrl = NO_LOGO_URL;
  chatId = 0;
  userCompany = this._userService.userCompany$.value;

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

  contactsParams = new Subject<Contacts>();
  readyToLoadMore = true;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public config: ConfigService,
    private dialog: MatDialog,
    private chatService: ChatService,
    private _usersService: UserService,
    private _userService: UserService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => {
          this.userCompany = res;

          if (this.userCompany && this.userCompany['logo'].length) {
            this.companyLogoUrl = this.config.serverUrl + this.userCompany['logo'][0].link;
          }
        });
    }

    if (isPlatformBrowser(this.platformId)) {
      const obj = getFromLocalStorage('B2B_ACTIVITY_SELECT');
      this.currentActivity = obj ? obj.activityName : null;
    }
    this.getChatType();
    this.getOwner();
    this.getUser();
    this.getContacts();
    this.subToContactsUpdates();
    this.subToSearchChanges();
    this.subToActivityChanges();
    this.updateContacts();

    if (this.userCompany && this.userCompany['logo'].length) {
      this.companyLogoUrl = this.config.serverUrl + this.userCompany['logo'][0].link;
    }

    setTimeout(() => {
      this.dimensions.ListCollection =
        this.ListContainer.nativeElement.clientHeight - this.ListCollection.nativeElement.clientHeight;
    }, 0);
  }

  getOwner(): void {
    if (isPlatformBrowser(this.platformId)) {
      const chatLS = getFromLocalStorage('chat');
      if (chatLS) {
        this.owner = chatLS.owner;
      }
      this.chatService.owner
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(owner => {
          this.owner = owner;

          if (isPlatformBrowser(this.platformId)) {
            setToLocalStorage('chat', {section: this.section, owner: +owner});
          }

          this.updateContacts();
        });
    }
  }

  getUser(): void {
    this._usersService.currentUser$
      .pipe(
        filter((user: User) => !!user),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((user: User) => this.user = user);
  }

  getChatType() {
    if (isPlatformBrowser(this.platformId)) {
      const chatLS = getFromLocalStorage('chat');
      if (chatLS) {
        this.section = chatLS.section;
      }
      this.chatService.chatType
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(type => this.section = type);
    }
  }

  companyHasActivities(): boolean {           // скрываем продавца(owner === 2), если у компании нет видов деят-ти
    const actNameConvert = actNameConverter;
    let actCount = 0;
    const array = actNameConvert.filter(value => {
      return !!(this.userCompany[value.dispatchM] && this.userCompany[value.dispatchM].length);
    });
    actCount = array.length;
    if (this.userCompany['warehousesRents'].length) {
      actCount++;
    }
    return !!actCount;
  }

  getContacts(): void {
    this.contactsParams
      .pipe(
        switchMap(value => {
          if (!value.page) {
            this.page = 1;
          }
          if (!this.filtered.length) {
            this.loading = true;
          }
          return this.chatService.getContacts1(value);
        })
      )
      .subscribe(value => {
        if (this.page > 1) {
          this.filtered = [...this.filtered, ...value['_embedded']['chat']];
        } else {
          this.filtered = value['_embedded']['chat'];
        }
        this.totalItems = value['total_items'];
        this.dimensions.ListCollection =
          this.ListContainer.nativeElement.clientHeight - this.ListCollection.nativeElement.clientHeight;
        if (this.chatId) {
          const contact = this.filtered.find(value1 => +value1['id'] === this.chatId);
          if (contact) {
            this.openChat(contact);
          }
          this.chatId = 0;
        }
        this.loading = false;
        this.emptyList = false;
        this.readyToLoadMore = true;
      });
  }

  subToContactsUpdates(): void {
    this.chatService.contacts
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(contacts => {
        this.updateContacts();
        if (contacts && contacts.chatId) {
          this.chatId = contacts.chatId;
        }
      });
  }

  updateContacts(): void {
    this.contactsParams.next({
      query: this.searchInput.value,
      categoryName: this.activeCategoryName,
      type: +this.section,
      owner: +this.owner,
      myCompany: this.companyId,
      myActivity: this.owner === 2 ? this.activityKey : null,
      activitySubId: this.owner === 2 ? this.activityId : null
    });
  }

  subToActivityChanges(): void {
    this.chatService.activityChanged
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((value: SelectedActivity) => {
        if (value.companyId) {
          this.companyId = value.companyId;
          this.activityKey = value.activityKey;
          this.activityId = value.activityId;
          this.updateContacts();
        }
      });
  }

  subToSearchChanges(): void {
    this.searchInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((value: any) => {
        this.page = 1;
        this.contactsParams.next({
          query: value,
          categoryName: this.activeCategoryName,
          type: +this.section,
          owner: +this.owner,
          myCompany: this.companyId,
          myActivity: this.owner === 2 ? this.activityKey : null,
          activitySubId: this.owner === 2 ? this.activityId : null
        });
      });
  }

  switchOwner(owner: number): void {
    if (isPlatformBrowser(this.platformId) && owner !== this.owner) {
      this.chatService.changeOwner(owner);
      if (owner === 2) {
        const obj = getFromLocalStorage('B2B_ACTIVITY_SELECT');
        this.currentActivity = obj ? obj.activityName : null;
      }
      this.filtered = [];
      this.emptyList = true;
      this.searchInput.setValue('');
      this.updateContacts();
    }
  }

  switchActivity(): void {
    this.activitySwitch.emit();
    this.chatService.destroyWindow();
  }

  isCurrentChat(contact): boolean {
    return +contact.id === +this.chatService.currentChatId.value;
  }

  activityName(keyName): string {         // ключ для тултипа из активитиНэймс - SeaCarriers -> Морские перевозки
    if (keyName) {
      let keyActivity = keyName.replace(/s\s*$/, '');
      if (keyActivity === 'warehousesRent') {
        keyActivity = 'warehouseRent';
      }
      const activity = this.activities.find(value => value.keyName === keyActivity);
      if (activity) {
        return activity ? activity['name' + this.config.locale] : '';
      }
    }
  }

  activityKeyName(keyName): string {         // ключ для класса из OCCUPATION_CLASS
    if (keyName) {
      let keyActivity = keyName.replace(/s\s*$/, '');
      if (keyActivity === 'warehousesRent') {
        keyActivity = 'warehouseRent';
      }
      return keyActivity;
    }
  }

  changeCategory(evt): boolean {          // изменение категории: Все чаты, все групповые чаты, поставщик и тд
    this.activeCategoryName = evt.value;
    this.filtered = [];
    this.emptyList = true;
    this.updateContacts();
    this.chatService.destroyWindow();
    return true;
  }

  getMore(): void {
    if (this.readyToLoadMore && this.page * this.chatService.contactsLimit <= this.totalItems + 1) {
      this.page++;
      this.readyToLoadMore = false;
      this.contactsParams.next({
        page: this.page,
        query: this.searchInput.value,
        categoryName: this.activeCategoryName,
        type: +this.section,
        owner: +this.owner,
        myCompany: this.companyId,
        myActivity: this.owner === 2 ? this.activityKey : null,
        activitySubId: this.owner === 2 ? this.activityId : null,
      });
    }
  }

  newDialogChat(): void {
    this.newDialogChatRef = this.dialog.open(ChatNewComponent, {
      width: '400px',
      data: {
        companyId: this.companyId,
        activityKey: this.activityKey,
        activityId: this.activityId,
        owner: +this.owner,
        user: this.user,
        activities: this.activities
      }
    });
  }

  getContactLogoUrl(contact: any): string {
    let logoUrl = NO_LOGO_URL;
    if (contact.logo) {
      logoUrl = this.config.serverUrl + '/data/images/' + contact.logo;
    } else if (contact.avatars.length && contact.avatars[0].length) {
      logoUrl = this.config.serverUrl + contact.avatars[0][0].link;
    }
    return logoUrl;
  }

  time(date): string {
    return moment(date)
      .locale('ru')
      .format('LT');
  }

  filter(section): void {               // системные и др чаты
    if (isPlatformBrowser(this.platformId)) {
      setToLocalStorage('chat', {section: section, owner: +this.owner});
    }
    this.section = section;
    this.updateContacts();
    this.filtered = [];
    this.emptyList = true;
    this.page = 1;
    this.searchInput.setValue('');
    this.chatService.setChatType(section);
    this.chatService.changeOwner(+this.owner);
    this.chatService.destroyWindow();
  }

  declOfNum(n, titles) {
    return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
  }

  summary(n, c) {
    return n + ' ' + this.declOfNum(n, c);
  }

  openChat(contact: any): void {
    this.chatService.currentChatLogo = this.getContactLogoUrl(contact);
    this.chatService.openChat(contact.id);
  }

  @HostListener('window:beforeunload', ['$event']) unloadHandler() {
    if (isPlatformBrowser(this.platformId)) {
      setToLocalStorage('chat', {section: this.section, owner: 1});
    }
    this.chatService.destroyWindow();
  }
}
