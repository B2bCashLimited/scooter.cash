import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService, ProductService } from '@b2b/services';
import { MarketplaceCategory } from '@b2b/models';
import { PaymentOptions } from '@b2b/constants';
import { getFromLocalStorage } from '@b2b/helpers/utils';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-product-item-one-click',
  templateUrl: './product-item-one-click.component.html',
  styleUrls: ['./product-item-one-click.component.scss']
})
export class ProductItemOneClickComponent {

  @Input() product: any;
  @Input() category: MarketplaceCategory;
  @Input() checkedProducts = [];
  @Output() compared: EventEmitter<any> = new EventEmitter<any>();

  forCompare = false;
  isFavorite = false;

  currentCart: Map<any, any> = this._productService.cartedProducts;
  parentCategoryId = this._route.snapshot.params.parentCategoryId;
  queryParamsUtm = isPlatformBrowser(this.platformId) && getFromLocalStorage('UTM');

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public config: ConfigService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _productService: ProductService,
  ) {
  }

  makeOrder(): void {
    const categoryId = this.category && this.category.id || this.parentCategoryId ? 'all' : null;
    let queryParams: any;

    this._productService.clearCart();
    this._productService.isBuyNow.next(true);
    this.product.count = 1;

    if (this.queryParamsUtm) {
      queryParams = {...JSON.parse(this.queryParamsUtm)};
    }

    if (this.product.productPrices) {
      const len = (<any[]>this.product.productPrices).length;
      this.product.price = this.product.productPrices[Math.floor((len - 1) / 2)].price;
    }

    this.product.paymentOption = PaymentOptions.BARGAIN_IS_POSSIBLE;
    this._productService.cartedProducts.set(`${categoryId}`, [this.product]);

    this._router.navigate(['make-individual-order'], {queryParams})
      .then((value: boolean) => {
        if (value) {
          this._productService.isSearchForAllCategories$.next(false);
        }
      });
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  }

  toggleCompare() {
    this.forCompare = !this.forCompare;
    this.compared.next(this.forCompare);
  }

  productChecked(): void {
    const categoryId = this.category && this.category.id || this.parentCategoryId ? 'all' : null;
    const checkedProductsIds: number[] = this.checkedProducts ? this.checkedProducts.map(value => +value.id) : [];

    if (!checkedProductsIds.includes(+this.product.id)) {
      this.checkedProducts.push(this.product);
    } else {
      this.checkedProducts = this.checkedProducts.filter(value => +value.id !== +this.product.id);
    }
    this.currentCart.set(categoryId, this.checkedProducts);
  }

}
