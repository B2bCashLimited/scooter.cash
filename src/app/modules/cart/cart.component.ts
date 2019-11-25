import { Component, OnInit } from '@angular/core';
import { ConfigService, ProductService } from '@b2b/services';
import { registerLocaleData, Location } from '@angular/common';
import localeCn from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/ru';
import localeRu from '@angular/common/locales/ru';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  cartedProducts = [];
  cartedCategories: any[] = [];
  currentCart: Map<any, any>;
  currentItem: any;
  showPricesList = false;

  constructor(
    public config: ConfigService,
    private _productService: ProductService,
    private _router: Router,
    private _location: Location,
    private _route: ActivatedRoute,
  ) {
    registerLocaleData(localeCn);
    registerLocaleData(localeEn);
    registerLocaleData(localeRu);
  }

  get totalPrice(): number {
    let sum = 0;
    this.cartedProducts.forEach(value => {
      if (value.paymentOption !== 3) {
        sum = sum + value.price * value.count * (value.countUnit || 1);
      }
    });
    return sum;
  }

  get cartedCurrency() {
    return this.cartedProducts && this.cartedProducts.length && this.cartedProducts[0].currency;
  }

  handleClickBack() {
    this._location.back();
  }

  ngOnInit(): void {
    this.currentCart = this._productService.cartedProducts;

    this.currentCart.forEach((value: any[], key: number | string) => {
      if (value && value.length) {
        this.cartedProducts.push(...value);
        if (!this.cartedCategories.find(value1 => +value1.id === +key)) {
          this.cartedCategories.push(value[0].category);
        }
        if (key === 'all' && !this.cartedCategories.find(value1 => value1 === key)) {
          this.cartedCategories.push(value[0].category);
        }
      }
    });

    if (this.cartedProducts) {
      this.cartedProducts.forEach(value => {
        // начальные установки кол-ва и paymentOption
        if (!value.count) {
          value.count = 1;
        }

        if (!value.paymentOption) {
          value.paymentOption = 1;
        }
      });
    }
  }

  toggleWings(evt: any, item): void {
    evt.stopPropagation();

    this.cartedProducts.forEach(value => value.showWings = false);

    if (item) {
      item.showWings = true;
    }
  }

  submit(): void {
    const queryParams: any = {};

    for (const key in this._route.snapshot.queryParamMap['params']) {
      if (this._route.snapshot.queryParamMap['params'].hasOwnProperty(key)) {
        if (key.includes('utm')) {
          queryParams[key] = this._route.snapshot.queryParamMap['params'][key];
        }
      }
    }

    this._router.navigate(['make-individual-order'], {queryParams});
  }

  clearCart(): void {
    this.cartedProducts = [];
    this.cartedCategories = [];
    this.currentCart.clear();
  }

  getCartedProductsByCategory(categoryId: number | string): any[] {
    if (categoryId === 'all') {
      return this.cartedProducts.filter(value => value.category && value.category === categoryId);
    } else {
      return this.cartedProducts.filter(value => (value.category && +value.category.id) === +categoryId);
    }
  }

  deleteFormCart(product): void {
    this.cartedProducts = this.cartedProducts.filter(value => +value.id !== +product.id);
    this.currentCart.set(product.category && +product.category.id,
      this.getCartedProductsByCategory(product.category && +product.category.id));
  }

  onCountInputChange(evt: any, item) {
    if (Number(evt.target.value) <= 0) {
      this.deleteFormCart(item);
    }
  }

  onAllProposalsClick(item): void {
    this.currentItem = item;
    this.showPricesList = true;
  }

}
