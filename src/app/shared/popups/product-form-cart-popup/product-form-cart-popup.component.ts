import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ConfigService, ProductService } from '@b2b/services';
import { CategorySimple } from '@b2b/models';
import { registerLocaleData } from '@angular/common';
import localeCn from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/ru';
import localeRu from '@angular/common/locales/ru';

@Component({
  selector: 'app-product-form-cart-popup',
  templateUrl: './product-form-cart-popup.component.html',
  styleUrls: ['./product-form-cart-popup.component.scss']
})
export class ProductFormCartPopupComponent implements OnInit {

  cartedCategories: CategorySimple[] = [];
  cartedProducts = [];
  currentCart: Map<any, any>;
  currentItem;
  showPricesList = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ProductFormCartPopupComponent>,
    private _productService: ProductService,
    public config: ConfigService
  ) {
    registerLocaleData(localeCn);
    registerLocaleData(localeEn);
    registerLocaleData(localeRu);
  }

  ngOnInit(): void {
    // this.currentCart = this.data.fromChina ? this._productService.cartedProductsFromChina : this._productService.cartedProducts;
    this.currentCart = this._productService.cartedProducts;

    if (this.data.checkedProducts) {
      this.cartedProducts = this.data.checkedProducts;
    } else {
      const cartedProducts = [];
      const cartedCategories = [];

      this.currentCart.forEach((value: any[], key: number) => {
        if (value && value.length) {
          cartedProducts.push(...value);
          if (!cartedCategories.find(value1 => +value1.id === key)) {
            cartedCategories.push(value[0].category);
          }
        }
      });

      if (cartedProducts) {
        this.cartedProducts = cartedProducts;   // берем уже добавленные из корзины
        this.cartedProducts.forEach(value => {
          // начальные установки кол-ва и paymentOption
          if (!value.count) {
            value.count = 1;
          }

          if (!value.paymentOption) {
            value.paymentOption = (this.data.individualOrder && this.data.fromChina) ? 3 : 1;
          }
        });

        this.cartedCategories = cartedCategories;
      }
    }
  }

  get cartedCurrency() {
    return this.cartedProducts && this.cartedProducts.length && this.cartedProducts[0].currency;
  }

  get totalPrice() {
    let sum = 0;
    this.cartedProducts.forEach(value => {
      if (value.paymentOption !== 3) {
        sum = sum + value.price * value.count * (value.countUnit || 1);
      }
    });
    return sum;
  }

  clearCart(): void {
    this.cartedProducts = [];
    this.cartedCategories = [];
    this.currentCart.clear();
  }

  deleteFormCart(product): void {
    this.cartedProducts = this.cartedProducts.filter(value => +value.id !== +product.id);
    this.currentCart.set(product.category && +product.category.id,
      this.getCartedProductsByCategory(product.category && +product.category.id));
  }

  toggleWings(evt: any, item): void {
    evt.stopPropagation();

    this.cartedProducts.forEach(value => value.showWings = false);

    if (item) {
      item.showWings = true;
    }
  }

  onAllProposalsClick(item): void {
    this.currentItem = item;
    this.showPricesList = true;
  }

  onCountInputChange(evt: any, item) {
    if (Number(evt.target.value) <= 0) {
      this.deleteFormCart(item);
    }
  }

  getCartedProductsByCategory(categoryId: number) {
    return this.cartedProducts.filter(value => (value.category && +value.category.id) === +categoryId);
  }

  submit(redirectToOrder = false): void {
    this.dialogRef.close(redirectToOrder);
  }
}
