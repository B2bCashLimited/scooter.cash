import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AuthService, ConfigService, LeadService, ProductService, UserService } from '@b2b/services';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import {
  MakeIndividualSignupComponent
} from '@b2b/modules/make-individual-order/components/individual-signup/make-individual-signup.component';
import { filter, first, map, switchMap, takeUntil } from 'rxjs/operators';
import { PaymentOptions } from '@b2b/constants';
import { registerLocaleData, Location, isPlatformBrowser } from '@angular/common';
import localeCn from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/ru';
import localeRu from '@angular/common/locales/ru';
import { OrdersShippingDialogComponent } from '@b2b/shared/popups/orders-shipping-dialog/orders-shipping-dialog.component';
import { environment } from '@b2b/environments/environment';
import { clearLocalStorage, clearSessionStorage } from '@b2b/helpers/utils';

@Component({
  selector: 'app-make-individual-order',
  templateUrl: './make-individual-order.component.html',
  styleUrls: ['./make-individual-order.component.scss']
})
export class MakeIndividualOrderComponent implements OnInit, OnDestroy {

  @ViewChild(MakeIndividualSignupComponent) signupComponent: MakeIndividualSignupComponent;

  cartedProducts = [];
  currency: any = 'RUB';
  currentCart: any = [];
  isBuyNow = false;
  item: any = {};
  userCompany: any;
  city: any;
  domainData;
  country: any;
  hostName = environment.production ? location.hostname : 'scooter.cash';
  freeOrderId: number;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  get isLoggedIn() {
    return this._authService.isLoggedIn;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public config: ConfigService,
    private _authService: AuthService,
    private _location: Location,
    private _productService: ProductService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _matDialog: MatDialog,
    private _userService: UserService,
    private _snackBar: MatSnackBar,
    private _leadService: LeadService,
  ) {
    registerLocaleData(localeCn);
    registerLocaleData(localeEn);
    registerLocaleData(localeRu);
  }

  handleClickBack() {
    this._location.back();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.currentCart = this._productService.cartedProducts;
    this.domainData = this._userService.domainData$.value;
    this._userService.userCompany$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.userCompany = res);

    this._userService.getGeoDataByIp()
      .pipe(
        filter(res => !!res),
        first()
      )
      .subscribe(res => {
        if (res.city && res.city.id) {
          const item = res.city;
          item.region = res.region.id ? res.region : {};
          item.region.country = res.country;
          this.city = res.city;
        }

        this.country = res.country;
      });

    this._productService.isBuyNow
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((bool) => this.isBuyNow = bool);

    this.currentCart.forEach(value => {
      value.forEach(prod => {
        if (Array.isArray(prod.photos) && !!prod.photos.length) {
          prod['imgSrc'] = `${this.config.serverUrl}${(<string>prod.photos[0].link).charAt(0) !== '/' ? '/' : ''}${prod.photos[0].link}`;
        } else if (typeof prod.photos === 'string') {
          prod['imgSrc'] = `${this.config.serverUrl}${(<string>prod.photos).charAt(0) !== '/' ? '/' : ''}${prod.photos}`;
        } else {
          prod['imgSrc'] = null;
        }

        this.cartedProducts.push(prod);
      });
    });

    this.currency = this.cartedProducts[0].currency;
  }

  deleteAllItems() {
    this.cartedProducts = [];
    this._router.navigate([`/catalog`]);
  }

  deleteItem(prod) {
    this.cartedProducts = this.cartedProducts.filter((item) => item.id !== prod.id);

    if (!this.cartedProducts.length) {
      this._router.navigate([`/catalog`]);
    }
  }

  subAdd(bool: boolean) {
    if (bool) {
      ++this.cartedProducts[0].count;
    } else if (this.cartedProducts[0].count > 1) {
      --this.cartedProducts[0].count;
    }
  }

  get totalPrice(): number {
    return this.cartedProducts.reduce((acc, curVal) => {
      if (curVal.paymentOption !== PaymentOptions.WAITING_FOR_OFFERS) {
        return acc + (curVal.price * curVal.count * (curVal.countUnit || 1));
      }
    }, 0);
  }

  makeOrder() {
    this.touchEverything();
    if (this.signupComponent) {
      if (this.signupComponent.regForm.invalid) {
        return null;
      }
      this.signupComponent.onSubmit(+this.country.id);
    } else {
      this.submit(3);
    }
  }

  markFormGroupAsTouched(fg: FormGroup) {
    (<any>Object).values(fg.controls).forEach(control => {
      control.markAsTouched();
      if (control.controls) {
        this.markFormGroupAsTouched(control);
      }
    });
  }

  registrationComplete(evt: any): void {
    if (evt && evt.user) {
      const individCompany = +evt.user.individual;
      this.submit(3, evt.isNewUserRegistered, individCompany, evt.user);
    }
  }

  submit(scope, isNewUserRegistered = false, indivCompanyId?, user?: any) {
    if (this.isLoggedIn || indivCompanyId) {
      const products = {};
      const names = [];

      this.cartedProducts.forEach(prod => {
        names.push(prod.nameRu + ' (' + prod.count + ')');
        const prodId = +prod.id;
        products[prodId] = {
          count: prod.count,
          price: prod.price || 0,
          paymentOption: prod.paymentOption
        };
      });

      const body: any = {
        alternative: 0,
        company: indivCompanyId || this.userCompany && this.userCompany.id || null,
        deliveryPrice: null,
        deliveryPriceMe: this.currency.id,
        pickupCity: (this.city && this.city.id) || (this.country && this.country.id) || null,
        individual: 1,
        paymentTypeOptions: {
          cashlessPaymentsOnCard: false,
          cashPayments: false,
        },
        products: products,
        scope: scope,
        supplierOrManufacturer: 1,
        siteName: this.domainData && this.domainData.domain || this.hostName,
      };

      this.submitFreeOrder(body)
        .pipe(
          filter(res => !!res),
          switchMap(() => {
            const getParams = this._route.snapshot.queryParamMap;
            let data: any = {};

            if (isNewUserRegistered) {
              data = {
                email: user.email,
                phone: user.phone,
                name: user.lastName ? user.lastName + ' ' + user.firstName : user.firstName,
                name_ru: names.join(','),
                summ: this.totalPrice,
                order: this.freeOrderId
              };
            } else {
              const currentUser = this._userService.currentUser;
              data = {
                email: currentUser.email,
                phone: currentUser.phone,
                name: currentUser.lastName ? currentUser.lastName + ' ' + currentUser.firstName : currentUser.firstName,
                name_ru: names.join(','),
                summ: this.totalPrice,
                order: this.freeOrderId
              };
            }

            return this._leadService.postLead(getParams, data);
          }),
          switchMap(() => {
            if (isNewUserRegistered) {     // чистим токены, если это было незареганое физ лицо
              if (isPlatformBrowser(this.platformId)) {
                clearLocalStorage();
                clearSessionStorage();
              }
            }

            return this._matDialog.open(OrdersShippingDialogComponent, {
              width: '400px',
              height: 'auto',
            }).afterClosed();
          }),
          takeUntil(this._unsubscribe$)
        )
        .subscribe(() => this._router.navigate([this.isLoggedIn ? 'profile' : '']));
    }
  }

  submitFreeOrder(body) {
    return this._productService.createFreeOrder(body)
      .pipe(
        map((value: any) => {
          if (!value.code) {      // добавить проверку на принятие заказа
            this._productService.clearCart();         // чистим корзины
            this.freeOrderId = value.freeOrder;
            return true;
          } else {
            this._snackBar.open(value.message, 'Ok', {duration: 3000});
            return false;
          }
        }));
  }

  touchEverything() {
    if (this.signupComponent) {
      this.markFormGroupAsTouched(this.signupComponent.regForm);
    }
  }
}
