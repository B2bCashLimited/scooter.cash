import { Component, Input, OnDestroy } from '@angular/core';
import { ConfigService, ProductService } from '@b2b/services';
import { MatDialog } from '@angular/material';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  SuppliersPricesDialogComponent
} from '@b2b/modules/product-detail/dialogs/suppliers-prices-dialog/suppliers-prices-dialog.component';

@Component({
  selector: 'app-suppliers-city-list',
  templateUrl: './suppliers-city-list.component.html',
  styleUrls: ['./suppliers-city-list.component.scss']
})
export class SuppliersCityListComponent implements OnDestroy {

  suppliersShort: any[] = [];
  suppliers: any[] = [];
  page = 1;

  private _product: any;
  @Input() set product(value: any) {
    this._product = value;
    if (value && value.hash) {
      this._productService.getProductListSuppliers(value.hash, value.showcase.showcaseUnits.currency.id)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => {
          this.suppliers = res.suppliers;

          if (res.suppliers.length > 3) {
            this.suppliersShort = res.suppliers.slice(0, 2);
          }
        });
    }
  }

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _productService: ProductService,
    public config: ConfigService,
    private _matDialog: MatDialog,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  openPricesList(prices): void {
    this._matDialog.open(SuppliersPricesDialogComponent, {
      disableClose: true,
      data: {
        prices: prices,
        currency: this._product.showcase.showcaseUnits.currency.id
      }
    });
  }

}
