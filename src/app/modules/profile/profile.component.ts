import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ActivityNameService,
  CategoriesService,
  ChatService,
  ConfigService,
  MyOrdersService, PartnershipService,
  ProductService,
  UserService
} from '@b2b/services';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { delay, filter, first, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatDialog, PageEvent } from '@angular/material';
import { Category, Create, MyOrders, Pager } from '@b2b/models';
import { OrderSuccessDialogComponent } from '@b2b/shared/popups/order-success-dialog/order-success-dialog.component';
import { ConfirmPopupComponent } from '@b2b/shared/popups/confirm-popup/confirm-popup.component';
import * as moment from 'moment';
import { ChatWidgetModalComponent } from '@b2b/shared/chat/widget/widget.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  @ViewChild('wrapCards') wrapCards: ElementRef;
  @ViewChild('wrapCardsAlternative') wrapCardsAlternative: ElementRef;

  myOrders: MyOrders[] = [];
  alternatives: MyOrders[] = [];
  pageEvent: PageEvent = {
    pageSize: 5,
    pageIndex: 1,
    length: 25
  };
  isAlternativesOpened = false;
  serverUrl = this.config.serverUrl;
  isPending = false;
  userCompany: any;
  sortDateNew = true;
  isLoading = false;
  selectedStatus: string | number = -1;
  categories: Category[] = [];
  selectedCategory: Category;
  dateFrom: string;
  dateTo: string;

  readonly minDate = new Date(new Date().getFullYear() - 2, new Date().getMonth(), new Date().getDate());
  readonly maxDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  readonly statuses = [
    {
      label: 'profile.statuses.confirmed',
      value: 1
    },
    {
      label: 'profile.statuses.waiting',
      value: 3
    },
    {
      label: 'profile.statuses.paid',
      value: 'paid'
    },
  ];

  private unsubscribe$: Subject<void> = new Subject<void>();
  private _dateSub: Subscription;
  private _chatSub: Subscription;

  constructor(
    public config: ConfigService,
    private _myOrdersService: MyOrdersService,
    private _userService: UserService,
    private _productService: ProductService,
    private _categoriesService: CategoriesService,
    private _matDialog: MatDialog,
    private _chatService: ChatService,
    private _actNameService: ActivityNameService,
    private _partnershipService: PartnershipService,
  ) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this._userService.userCompany$
      .pipe(
        filter(res => !!res),
        switchMap((userCompany: any) => {
          this.userCompany = userCompany;
          return this._getMyOrders();
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    this._getCategories();
  }

  onStatusFilterChanged(evt): void {
    if (!!evt) {
      this._getMyOrders()
        .pipe(first())
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  onSelectedCategoryChanged(): void {
    this._getMyOrders()
      .pipe(first())
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  onDateChanged(evt: {input: any, source: any, value: any[]}) {
    if (evt.value && evt.value.length > 0) {
      this.dateFrom = moment(evt.value[0]).format('YYYY-MM-DD');
      this.dateTo = moment(evt.value[1]).format('YYYY-MM-DD');
      this._getMyOrders()
        .pipe(first())
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  showCards(order: MyOrders): void {
    order['isCardOpened'] = !order['isCardOpened'];

    if (order['isCardOpened']) {
      order['isLoading'] = true;
      this._getFreeProducts(order);
    }
  }

  openAlternatives(): void {
    this.isAlternativesOpened = !this.isAlternativesOpened;

    if (!this.isAlternativesOpened) {
      this.alternatives.forEach(value => value['isCardOpened'] = false);
    }
  }

  showAlternativeCards(order: MyOrders): void {
    order['isCardOpened'] = !order['isCardOpened'];

    if (order['isCardOpened']) {
      order['isLoading'] = true;
      this._getFreeProducts(order);
    } else {
      this.alternatives.forEach(value => value['isCardOpened'] = false);
    }
  }

  confirmAlternativeOrder(order: MyOrders): void {
    const data: any = {
      id: order.id,
      status: 6,
      alternative: order.alternative ? 1 : 0,
      totalBrut: +order.totalBrut,
      totalCount: order.totalCount,
      totalNet: +order.totalNet,
      totalPrice: +order.totalPrice,
      totalVolume: +order.totalVolume,
      companyRecipientId: order.takenCompany && +order.takenCompany.id || null
    };

    if (!this.isPending) {
      this.isPending = true;

      this._productService.confirmProposalFreeOrder(data.id)
        .pipe(
          switchMap(() => {
            return this._matDialog.open(OrderSuccessDialogComponent, {
              width: '400px',
              height: 'auto',
              disableClose: true
            }).afterClosed();
          }),
          switchMap(() => this._getMyOrders())
        )
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  deleteOrder(order: MyOrders): void {
    this._matDialog.open(ConfirmPopupComponent)
      .afterClosed()
      .pipe(
        switchMap((res) => {
          if (res) {
            return this._productService.massDeleteProducts({ids: order.id})
              .pipe(
                switchMap(() => this._getMyOrders())
              );
          }

          return of(null);
        })
      ).subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  sortByDate(): void {
    if (this._dateSub && !this._dateSub.closed) {
      this._dateSub.unsubscribe();
    }

    this.sortDateNew = !this.sortDateNew;
    this._dateSub = this._getMyOrders()
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  pageChanged(evt): void {
    if (!!evt) {
      this.pageEvent.pageIndex = evt;
      this._getMyOrders()
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  onChatButtonClick(myOrder: MyOrders): void {
    const activityId = +myOrder.takenActivity;
    const activityKeyName = 'supplier';
    this._chatService.changeOwner(1);

    if (this._chatSub && !this._chatSub.closed) {
      this._chatSub.unsubscribe();
    }

    this._chatSub = this._partnershipService.checkPartnership(this.userCompany.id, activityId, activityKeyName)
      .pipe(
        mergeMap(value => {
          const chatType = value.result ? 2 : 3;
          this._chatService.setChatType(chatType);
          this._matDialog.open(ChatWidgetModalComponent, {
            panelClass: 'chat__widget',
          });

          const params: Create = {
            chat: {
              name: '',
              type: chatType, // зависит от того есть ли в партнерах (2) или нет (3)
            },
            owner: {
              userId: +this._userService.currentUser.id,
              companyId: this.userCompany.id,
              isCustomer: true,
            },
            relations: [{
              userId: (+myOrder.takenCompany && myOrder.takenCompany.user.id) || (myOrder.company && +myOrder.company.user.id),
              companyId: (myOrder.takenCompany && myOrder.takenCompany.id) || (myOrder.company && +myOrder.company.id),
              activity: activityKeyName, //  keyName
              activityId: activityId,
            }]
          };

          return this._chatService.create(params);
        })
      )
      .subscribe(res => this._chatService.openChat(res['id']));
  }

  private _getMyOrders(): Observable<any> {
    const query: any = {
      company: this.userCompany.id,
      order: this.sortDateNew ? 'dateDesc' : 'dateAsc',
      confirmed: this.selectedStatus === 3 || this.selectedStatus === 1 ? this.selectedStatus : null,
      paid: this.selectedStatus === 'paid' ? this.selectedStatus : null,
      category: this.selectedCategory,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      page: !!this.pageEvent.pageIndex && this.pageEvent.pageIndex || 1,
      limit: this.pageEvent.pageSize,
    };

    this.isLoading = true;
    this.isAlternativesOpened = false;

    return this._myOrdersService.getMyOrders(query)
      .pipe(
        map(({pager, data}) => {
          this.pageEvent = {
            length: pager.totalItems,
            pageIndex: pager.currentPage,
            pageSize: pager.perPage
          };
          this.myOrders = data.map(item => {
            item['isCardOpened'] = false;
            item['isLoading'] = false;
            item.products = [];
            item['payformData'] = {
              freeOrderId: +item.id,
              acquiring: item.takenCompany && item.takenCompany.acquiring || null,
              currency: +item.currency.id,
              paid: item.paid
            };
            item.totalCount = +item.totalCount;
            item.totalPrice = +item.totalPrice;

            return item;
          });
        })
      );
  }

  private _getFreeProducts(order: MyOrders): void {
    /*const params: any = {
      freeOrderId: order.id,
      page: 1,
      limit: 25
    };*/

    // TODO: replace method to alternatives
    /*this._productService.getFreeOrderProposals(params)
      .pipe(
        tap(() => order.products = []),
        switchMap(({pager, proposals}) => {
          if (proposals && (proposals as any[]).length > 0) {
            const products = (proposals || []).map(proposal => {
              return this._myOrdersService.retrieveFreeProduct({freeOrder: proposal.id});
            });
            return combineLatest(products);
          } else {
            order['isLoading'] = false;
            return of([]);
          }
        })
      )*/

    this._myOrdersService.retrieveFreeProduct({freeOrder: order.id})
      .pipe(tap(() => order.products = []))
      .subscribe(({pager, freeProduct}) => {
        const products = [];
        const alternativeProducts = [];
        order['isLoading'] = false;
        (freeProduct || []).forEach(freeProd => {
          if (freeProd.alternativeForProduct) {
            alternativeProducts.push(freeProd);
          } else {
            products.push(freeProd);
          }
        });
        alternativeProducts.forEach(value => {
          const prod = products.find((pr) => +pr.product.id === value.alternativeForProduct);
          if (prod) {
            prod.alternativeProduct = value;
          }
        });

        order.products.push(...products);
      }, () => order['isLoading'] = false);
  }

  private _getCategories() {
    this._categoriesService.getCategoryByName('Спорт на открытом воздухе')
      .pipe(
        filter((res: any[]) => !!res && res.length > 0),
        map((res: any[]) => {
          return res.find(value => !(value.path as string).includes('.'));
        }),
        switchMap((res: any) => {
          if (res) {
            return this._categoriesService.getCategoryByIdAndNormalizeChildren(res.id)
              .pipe(
                tap((categories: Category[]) => this.categories = categories),
                delay(100)
              );
          }

          return of(null);
        })
      )
      .subscribe();
  }

}
