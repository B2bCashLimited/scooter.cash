import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AcquiringTypes, UnitTypes } from '@b2b/constants';
import { AcquiringService } from '@b2b/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-acquiring-payform',
  templateUrl: './acquiring-payform.component.html',
  styleUrls: ['./acquiring-payform.component.scss']
})
export class AcquiringPayformComponent implements OnInit, OnDestroy {

  @Input() type = AcquiringTypes.TYPE_TINKOFF;
  @Input() data: {
    freeOrderId: number,
    acquiring: any,
    currency: any,
    paid: boolean
    /*amount: number,
    order: number,
    description?: string,
    name: string,
    email: string,
    phone?: number,
    terminalKey: string*/
  };
  @Input() statusId: string;

  acquiringTypes = AcquiringTypes;
  acquiring: any;
  allowedCurrency: boolean;
  isPending = false;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private _acquiringService: AcquiringService,
              private _router: Router,
              @Inject(DOCUMENT) private _document: Document) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.acquiring = this.data.acquiring && this.data.acquiring[0];
    this.allowedCurrency = this.data.currency === UnitTypes.RUBLE;
  }

  onPay(): void {
    const body: any = {
      freeOrderId: this.data.freeOrderId,
      acquiringId: this.acquiring.id
    };

    if (!this.isPending) {
      this.isPending = true;

      this._acquiringService.initPurchase(body)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(value => {
          this.isPending = false;
          if (value.success) {
            this._document.location.href = value.paymentUrl;
          }
        }, () => this.isPending = false);
    }
  }
}
