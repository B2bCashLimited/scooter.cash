import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService, ProductService } from '@b2b/services';
import { MarketplaceCategory } from '@b2b/models';
import { PaymentOptions } from '@b2b/constants';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss']
})
export class ProductItemComponent {

  @Input() product: any;
  @Input() category: MarketplaceCategory;
  @Input() checkedProducts = [];

  forCompare = false;
  isFavorite = false;

  currentCart: Map<any, any> = this._productService.cartedProducts;
  parentCategoryId = this._route.snapshot.params.parentCategoryId;

  constructor(
    public config: ConfigService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _productService: ProductService,
  ) {
  }

  makeOrder(): void {
    const categoryId = this.category && this.category.id || this.parentCategoryId ? 'all' : null;
    this._productService.clearCart();
    this._productService.isBuyNow.next(true);
    this.product.count = 1;

    if (this.product.productPrices) {
      const len = (<any[]>this.product.productPrices).length;
      this.product.price = this.product.productPrices[Math.floor((len - 1) / 2)].price;
    }

    this.product.paymentOption = PaymentOptions.BARGAIN_IS_POSSIBLE;
    this._productService.cartedProducts.set(`${categoryId}`, [this.product]);
    this._router.navigate(['make-individual-order'])
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
