import {
  Component,
  OnInit,
  Inject,
  EventEmitter,
  Output,
  OnDestroy
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { actNameConverter, NO_LOGO_URL } from '../models/activity.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { ChatService, ConfigService } from '@b2b/services';
import { Create } from '@b2b/models';

@Component({
  selector: 'app-popup-new',
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss']
})
export class ChatNewComponent implements OnInit, OnDestroy {
  searchInput = new FormControl('');
  chatName = '';
  private total_items = 0;
  headerCompanyId = 0;
  private activityKey = '';
  categories = [];
  actNameConverter = actNameConverter;
  companies = [];
  activeCategoryId = '';
  activeCategoryName = '';
  activityId = 0;
  user: any;
  page = 1;
  loading = false;
  relations: Array<{
    name: string,
    companyId: number,
    activity: string,
    activityId: number,
    userId: number
  }> = [];
  empty = false;
  owner = 1;
  selected = [];
  @Output() selectedChange: EventEmitter<any> = new EventEmitter();
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
  readyToLoadMore = true;
  private _searchSub: Subscription;
  private _company1Sub: Subscription;
  private _company2Sub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private _translateService: TranslateService,
    private _matDialog: MatDialog,
    private snackBar: MatSnackBar,
    private _matDialogRef: MatDialogRef<ChatNewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _config: ConfigService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.categories = this.data.activities;
    this.headerCompanyId = this.data.companyId;
    this.activityKey = this.data.activityKey;
    this.user = this.data.user;
    this.activityId = this.data.activityId;
    this.owner = this.data.owner;
    this.getCompanies(this.owner);
    this.subToSearchChanges();
  }

  subToSearchChanges(): void {
    this._searchSub = this.searchInput.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((value) => {
        this.companies = [];
        this.page = 1;
        this.empty = false;
        this.loading = true;
        this.getCompanies(this.owner, this.page, value);
      });
  }

  getCompanies(owner, page = 1, query = ''): void {
    this.page = page;
    if (+owner === 1 && this.activeCategoryId) {
      const garbageRoute = this.actNameConverter.find(garbage => garbage.dispatchE === this.activeCategoryId);
      this.chatService.getCompaniesByCategory(page, query, garbageRoute.path)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(companies => {
          const garbageRoute1 = this.actNameConverter.find(garbage => {
            return garbage.dispatchE === this.activeCategoryId;
          });

          if (page === 1 && companies._embedded[garbageRoute1.dispatchF].length === 0) {
            this.empty = true;
            this.total_items = 0;
          } else {
            if (page === 1) {
              this.companies = [];
            }
            this.companies.push(...companies._embedded[garbageRoute1.dispatchF]);
            this.total_items = companies.total_items;
          }

          this.readyToLoadMore = true;
          this.loading = false;
        }, () => this.loading = false);
    } else if (+owner === 2) {
      this.chatService.getAllCompanies(page, query)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(companies => {
          if (page === 1 && companies['_embedded']['company'].length === 0) {
            this.empty = true;
            this.total_items = 0;
          } else {
            if (page === 1) {
              this.companies = [];
            }
            this.companies.push(...companies['_embedded']['company']);
            this.total_items = companies.total_items;
          }

          this.readyToLoadMore = true;
          this.loading = false;
        }, () => this.loading = false);
    }
  }

  changeCategory(e): void {
    this.companies = [];
    this.empty = false;
    this.total_items = 0;
    this.loading = true;
    if (+this.owner === 2) {
      const company = this.categories.find(category => <String>category.keyName === <String>this.activeCategoryId);
      this.activeCategoryName = company ? company['name' + this._config.locale] : '';
    } else {
      const activeCategory = this.categories.find(category => <String>category.keyName === <String>this.activeCategoryId);
      this.activeCategoryName = activeCategory ? activeCategory['name' + this._config.locale] : '';
      this.searchInput.setValue('');
    }
    this.getCompanies(this.owner);
  }

  changeSelection(company) {        // выбор чекбоксов для owner 2
    let activoCat = 'EMPTY_ACTIVITY';
    const index = this.selected.indexOf(company.id);
    if (index === -1) {
      this.selected.push(company.id);
      const found = this.actNameConverter.find(c => c.path === this.activityKey || c.path2 === this.activityKey);
      if (found) {
        activoCat = found['dispatchE'];
      } else {
        activoCat = 'NOT_FOUND_ACTIVITY';
      }
      this.relations.push(
        {
          name: company.name,
          companyId: +company.id,
          activity: activoCat,
          activityId: +this.activityId,
          userId: company._embedded.user.id ? +company._embedded.user.id : 0,
        }
      );
    } else {
      this.selected.splice(index, 1);
      this.relations.splice(index, 1);
    }
    this.selectedChange.emit(this.selected);
  }

  changeSelectionMyOrders(company) {          // выбор чекбоксов
    let key = '';
    if (company['_embedded']['company']) {
      key = company['_embedded']['company']['id'] + '_' + company['id'];
    } else {
      key = company['id'];
    }
    const index = this.selected.indexOf(key);
    if (index === -1) {
      this.selected.push(company._embedded.company.id + '_' + company.id);
      this.relations.push(
        {
          name: company._embedded.company.name,
          companyId: company._embedded.company.id
            ? +company._embedded.company.id
            : null,
          activity: this.activeCategoryId,
          activityId: company.id
            ? +company.id
            : +this.activityId, // Number(this.owner) === 1 ? 0 : Number(this.activityId),
          userId: company._embedded.company._embedded.user.id
            ? +company._embedded.company._embedded.user.id
            : 0,
        }
      );
    } else {
      this.selected.splice(index, 1);
      this.relations.splice(index, 1);
    }
    this.selectedChange.emit(this.selected);
  }

  checkout(company) {         // стили (не дает выбрать свою компанию?)
    let key = '';
    if (company['_embedded']['company']) {
      key = company['_embedded']['company']['id'] + '_' + company['id'];
    } else {
      key = company['id'];
    }
    return this.selected.indexOf(key) > -1;
  }

  getMoreCompanies(): void {
    if (this.readyToLoadMore && this.page * this.chatService.companiesLimit <= this.total_items + 1) {
      this.loading = true;
      this.readyToLoadMore = false;
      this.page++;
      this.getCompanies(this.owner, this.page, this.searchInput.value);
    }
  }

  getCompanyLogoUrl(companyLogo: any): string {
    let logoUrl = NO_LOGO_URL;
    if (companyLogo.length) {
      logoUrl = this._config.serverUrl + companyLogo[0].link;
    }
    return logoUrl;
  }

  tooltip(method: boolean = false, text: string = '', duration: number = 15): boolean {
    if (method) {
      this.snackBar.open(text, 'Скрыть', {duration: duration * 1000});
      return true;
    } else {
      this.snackBar.dismiss();
      return false;
    }
  }

  valid(): boolean {
    if (this.relations.length > 1 && !this.chatName) {
      this.tooltip(true, 'Укажите название чата');
      return false;
    } else if (this.relations.length > 20) {
      this.tooltip(true, 'Выбрано максимальное количество участников: 20');
      return false;
    } else if (!this.relations.length) {
      this.tooltip(true, 'Выберите хотя бы одного участника');
      return false;
    } else {
      return true;
    }
  }

  createChat(params: Create) {
    if (+this.owner === 1) {
      delete params.owner.activity;
      delete params.owner.activityId;
      params.relations.map(group => {
        delete group['isCustomer'];       // нужно?
      });
    } else if (+this.owner === 2) {
      params.relations.map(group => {
        delete group['isCustomer'];
        delete group['activity'];
        delete group['activityId'];
      });
    }
    this.chatService.create(params)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => {
        this.chatService.contactsUpdate(
          {
            chatId: res['id']
          }
        );
        // this.chatService.openChat(res['id']);      // есть в контактс
      });
  }

  submit(toggle): boolean {
    if (!this.valid()) {
      return false;
    }
    const params = {
      chat: {
        name: this.chatName,
        type: 3
      },
      owner: {
        userId: +this.user.id,
        isCustomer: +this.owner !== 2,
        companyId: +this.headerCompanyId,
        activity: this.activityKey,
        activityId: +this.activityId
      },
      relations: this.relations
    };
    this.createChat(params);
    this._matDialogRef.close();
    this.tooltip(false);
  }

  getCompany(id): string {      // имя компании nameRu
    return this.activeCategoryName;
  }

  close(): void {         // крестик всего окна
    this._matDialogRef.close();
    this.tooltip(false);
  }

  declOfNum(n, titles) {
    return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
  }

  selectUsers(n) {      // склонения
    const s = [
      this._translateService.instant('chat.select1'),
      this._translateService.instant('chat.select2'),
      this._translateService.instant('chat.select3')
    ];
    const c = [
      this._translateService.instant('chat.companies1'),
      this._translateService.instant('chat.companies2'),
      this._translateService.instant('chat.companies3')
    ];
    return this.declOfNum(n, s) + ' ' + n + ' ' + this.declOfNum(n, c);
  }
}
