import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ConfigService, UnitsService } from '@b2b/services';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-suppliers-prices-dialog',
  templateUrl: './suppliers-prices-dialog.component.html',
  styleUrls: ['./suppliers-prices-dialog.component.scss']
})
export class SuppliersPricesDialogComponent implements OnInit, OnDestroy {

  assocUnits: any;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private _dialogRef: MatDialogRef<SuppliersPricesDialogComponent>,
    private _units: UnitsService,
    public config: ConfigService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this._units.$associativeUnits
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.assocUnits = res);
  }

  onClose() {
    this._dialogRef.close();
  }

}
