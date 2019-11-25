import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@b2b/shared/shared.module';
import { ROUTING } from './payment-success.routing';
import { PaymentSuccessComponent } from './payment-success.component';

@NgModule({
  declarations: [PaymentSuccessComponent],
  imports: [
    CommonModule,
    SharedModule,
    ROUTING,
  ]
})
export class PaymentSuccessModule {
}
