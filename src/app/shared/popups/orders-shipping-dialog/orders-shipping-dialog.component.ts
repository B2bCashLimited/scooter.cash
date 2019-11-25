import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-orders-shipping-dialog',
  templateUrl: './orders-shipping-dialog.component.html',
  styleUrls: ['./orders-shipping-dialog.component.scss']
})
export class OrdersShippingDialogComponent {

  constructor(
    private _matDialogRef: MatDialogRef<OrdersShippingDialogComponent>,
  ) {
  }

  /**
   * Close dialog
   */
  onCloseDialogButtonClick(): void {
    this._matDialogRef.close();
  }

}
