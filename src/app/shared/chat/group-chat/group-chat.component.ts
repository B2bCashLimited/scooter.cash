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
import {
  ActivatedRoute
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { actNameConverter, NO_LOGO_URL } from '../models/activity.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { ChatService, ConfigService } from '@b2b/services';
import { Create, Relations, RelationsAddToGroup } from '@b2b/models';

@Component({
  selector: 'app-popup-group',
  templateUrl: './group-chat.component.html',
  styleUrls: ['./group-chat.component.scss']
})
export class ChatGroupComponent implements OnInit, OnDestroy {

  searchInput = new FormControl('');
  chatName = '';
  private total_items = 0;
  private headerCompanyId = 0;
  private headerActivityKey = '';
  companies = [];
  page = 1;
  loading = false;
  owner = 1;
  chat: any = [];
  empty = false;
  activeCategoryId = '';
  activeCategoryName = '';
  categories = [];
  relations: Relations[] = [];
  relationsTruth: Relations[] = [];
  actNameConverter = actNameConverter;
  user: any;
  type: number;      // он же chatType, он же section
  activityKey = '';
  activityId = 0;
  relationsTruthIds = [];
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
  private _partnersSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    public dialogRef: MatDialogRef<ChatGroupComponent>,
    private chatService: ChatService,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _config: ConfigService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.getData(this.data);
    this.subToSearchChanges();
  }

  getData(data): void {
    this.chat = data.chat;
    this.categories = this.data.activities;
    this.user = data.user;
    this.type = data.type;        // 1-2-3 --- системные-партнеры-платформа
    this.activityId = data.activityId;
    this.activityKey = data.activityKey;
    this.headerCompanyId = data.companyId;
    const garbageRouted = this.actNameConverter.find(garbage => garbage.path === data.activityKey ||
      garbage.path2 === data.activityKey || garbage.dispatchE === data.activityKey || garbage.dispatchM === data.activityKey);
    this.headerActivityKey = garbageRouted ? garbageRouted['dispatchE'] : '';
    this.owner = data.owner;
    this.relations = data.chat.relations;
    this.relationsTruth = data.chat.relations;
    data.chat.relations.map(value => {
      if (value) {
        this.relationsTruthIds.push(value['id']);
      }
    });
    this.relations = Array.from(new Set(this.relations));
    this.chatName = this.chat.name;
    if (this.type === 2) {
      this.getPartners(this.owner);
    } else if (this.type === 1 || this.type === 3) {
      this.getCompanies(this.owner);
    }
  }

  subToSearchChanges(): void {
    this.searchInput.valueChanges
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
        if (+this.type === 2) {
          this.getPartners(this.owner, this.page, value);
        } else if (+this.type === 3) {
          this.getCompanies(this.owner, this.page, value);
        }
      });
  }

  getCompanies(owner, page = 1, query = ''): void {
    this.page = page;
    if (+owner === 1 && this.activeCategoryId) {
      const garbageRoute = this.actNameConverter.find(garbage => garbage.dispatchE === this.activeCategoryId);
      this._company1Sub = this.chatService.getCompaniesByCategory(page, query, garbageRoute.path)
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

  getPartners(owner, page = 1, query = ''): void {
    this.page = page;
    this.searchInput.setValue(query);
    const garbageRoute = this.actNameConverter.find(garbage => garbage.dispatchM === (this.activeCategoryId + 's'));

    if ((owner === 1 && this.activeCategoryId) || owner === 2) {
      this.chatService.getPartners(page, owner, this.headerCompanyId,
        this.activeCategoryId ? garbageRoute.dispatchE : this.activityKey, this.activityId, query)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(partners => {
          if (page === 1 && partners._embedded.partnership.length === 0) {
            this.empty = true;
            this.total_items = 0;
          } else {
            if (page === 1) {
              this.companies = [];
            }
            this.companies.push(...partners._embedded.partnership);
            this.total_items = partners.total_items;
          }

          this.readyToLoadMore = true;
          this.loading = false;
        }, () => this.loading = false);
    }
  }

  checkIfRelationIsInArray(array: Relations[], relation): any {
    let checked;
    const activeCategoryIds = <String>(this.activeCategoryId === 'warehouseRent' ? 'warehousesRent' : this.activeCategoryId) + 's';
    if (+this.type === 2) {
      if (+this.owner === 1) {
        checked = array.find(relations =>
          (+relations.id === +relation._embedded[this.activeCategoryId]['id']        // не надо?
            || +relations.activityId === +relation._embedded[this.activeCategoryId]['id'])
          && (relations.activityKey === activeCategoryIds
          || relations.activityKey === this.activeCategoryId)
        );
      } else {
        checked = array.find(relations =>
          +relations.companyId === +relation._embedded.company.id);
      }
    } else if (+this.type === 3) {
      if (+this.owner === 1) {
        checked = array.find(relations =>
          (+relations.id === +relation.id
            || +relations.activityId === +relation.id)
          && (relations.activityKey === activeCategoryIds
          || relations.activityKey === this.activeCategoryId)
        );
      } else {
        checked = array.find(relations =>
          +relations.companyId === +relation.id);
      }
    }
    return checked;
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
    if (+this.type === 2) {
      this.getPartners(this.owner);
    } else {
      this.getCompanies(this.owner);
    }
  }

  changeSelection(evt, company) {
    let field = 'company';
    if (+this.type === 3) {
      field = 'company';
    } else if (+this.type === 2) {
      field = 'partner';
    }
    const checked = this.checkIfRelationIsInArray(this.relations, company);
    if (!checked) {
      const activoT = {};       // []
      activoT[company.id] = this.activeCategoryId ? this.activeCategoryId : this.headerActivityKey;
      this.relations.push(
        {
          id: this.type === 2 ?                                   // нужно?     компани айди или активитиАйди
            (+this.owner === 2
                ? +company._embedded.company.id
                : +company._embedded[this.activeCategoryId ?
                  this.activeCategoryId : this.headerActivityKey]['id']
            )
            : +company.id,
          companyName: this.type === 2 ?
            (+this.owner === 2
              ? company._embedded.company.name
              : company._embedded[field].name)
            : company.name,
          companyId: this.type === 2
            ? (+this.owner === 2
              ? company._embedded.company.id
              : +company._embedded[field].id)
            : +this.owner === 2 ? +company.id ? +company.id : +company._embedded[field].id : +company._embedded[field].id,
          userId: this.type === 2
            ? (+this.owner === 2
                ? +company._embedded.company._embedded.user.id
                : +company._embedded[field]._embedded.user.id
            )
            : +this.owner === 2 ? +company._embedded.user.id : +company._embedded[field]._embedded.user.id,
          activityName: activoT[company.id],
          activityKey: activoT[company.id],
          activityId: this.type === 2 ? (+this.owner === 2
            ? +company._embedded.company.id
            : +company._embedded[this.activeCategoryId
              ? this.activeCategoryId
              : this.headerActivityKey]['id'])
            : +company.id
        }
      );
    } else {
      this.relations = this.relations.filter(relations => +relations.id !== +checked.id);
    }
  }

  checkout(company, activeCategoryId, type) {
    const checked = this.checkIfRelationIsInArray(this.relations, company);
    return checked;
  }

  getMoreCompanies(): void {
    if (this.readyToLoadMore && this.page * this.chatService.companiesLimit <= this.total_items + 1) {
      this.loading = true;
      this.readyToLoadMore = false;
      this.page++;
      if (+this.type === 2) {
        this.getPartners(this.owner, this.page, this.searchInput.value);
      } else {
        this.getCompanies(this.owner, this.page, this.searchInput.value);
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

  delete(e, i) {
    this.tooltip(false);
    this.relations = this.relations.filter(relations => +relations.id !== +i);
  }

  addRelationsToGroup(groups: RelationsAddToGroup[]): void {
    groups.map(group => {
      if (+this.owner === 2) {
        delete group['activity'];
        delete group['activityId'];
      }
    });

    this.chatService.addToGroup(groups, this.chat.id, this.chatName)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => {
        this.chatService.contactsUpdate(
          {
            chatId: res['id'],
          }
        );
      });
  }

  createChat(params: Create): void {
    if (+this.owner === 1) {
      delete params.owner.activity;
      delete params.owner.activityId;
      params.relations.map(group => {
        delete group['isCustomer'];       // что еще?
      });
    } else if (+this.owner === 2) {
      params.relations.map(group => {
        delete group['isCustomer'];       // что еще?
        delete group['activity'];
        delete group['activityId'];
      });
    }
    this.chatService.create(params)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => {
        this.chatService.contactsUpdate(
          {
            chatId: res['id'],
          }
        );
      });
  }

  submit(): boolean {
    if (!this.valid()) {
      return false;
    }
    let i = 0;
    const groups: RelationsAddToGroup[] = [];
    this.relations.map(relation => {
      if (relation.userId && +this.user.id !== +relation.userId) {      // все кроме юзера

        groups[i] = {                                           // в групс все что не равно юзеру из релэйшнс
          isCustomer: +this.owner === 2,
          chatId: +this.chat.id,
          userId: +relation.userId,
          companyId: +relation.companyId,
          activity: relation.activityKey,       // activityKey_e,
          activityId: +relation.activityId /*?
              +relation.activityId :
              +dropDownId*/
        };
        i++;
      }
    });
    if (this.relationsTruth.length > 2) {
      this.addRelationsToGroup(groups);
    } else {

      const params = {
        chat: {
          name: this.chatName,
          type: +this.type
        },
        owner: {
          userId: +this.user.id,
          isCustomer: +this.owner !== 2,
          companyId: +this.headerCompanyId,
          activity: this.activityKey,
          activityId: +this.activityId
        },
        relations: groups
      };
      this.createChat(params);
    }

    this.dialogRef.close();
    this.relations = [];
    this.tooltip(false);
  }

  getCompany(id): string {
    return this.activeCategoryName;
  }

  close(): void {
    this.dialogRef.close();
    this.tooltip(false);
  }

  declOfNum(n, titles) {
    return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
  }

  selectUsers(n) {
    const s = [
      this.translate.instant('chat.select1'),
      this.translate.instant('chat.select2'),
      this.translate.instant('chat.select3')
    ];
    const c = [
      this.translate.instant('chat.companies1'),
      this.translate.instant('chat.companies2'),
      this.translate.instant('chat.companies3')
    ];
    return this.declOfNum(n, s) + ' ' + n + ' ' + this.declOfNum(n, c);
  }
}
