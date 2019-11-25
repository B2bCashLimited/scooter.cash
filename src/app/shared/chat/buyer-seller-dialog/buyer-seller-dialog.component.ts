import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { actNameConverter } from '../models/activity.model';
import { UserService } from '@b2b/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-buyer-seller-dialog',
  templateUrl: './buyer-seller-dialog.component.html',
  styleUrls: ['./buyer-seller-dialog.component.scss']
})
export class BuyerSellerDialogComponent implements OnInit, OnDestroy {

  userCompany = this._userService.userCompany$.value;

  readonly SELLER_RESULT = 'seller';
  readonly BUYER_RESULT = 'buyer';

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<BuyerSellerDialogComponent>,
    private _userService: UserService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => {
          this.userCompany = res;

          if (!this.companyHasActivities()) {
            this.choose(this.BUYER_RESULT);
          }
        });
    } else {
      if (!this.companyHasActivities()) {
        this.choose(this.BUYER_RESULT);
      }
    }
  }

  companyHasActivities(): boolean {           // скрываем продавца(owner === 2), если у компании нет видов деят-ти
    const actNameConvert = actNameConverter;
    let actCount = 0;
    if (this.userCompany) {
      const array = actNameConvert.filter(value => {
        return !!(this.userCompany[value.dispatchM] && this.userCompany[value.dispatchM].length);
      });
      actCount = array.length;
      if (this.userCompany['warehousesRents'].length) {
        actCount++;
      }
    }
    return !!actCount;
  }

  choose(res: string) {
    this.dialogRef.close(res);
  }
}
