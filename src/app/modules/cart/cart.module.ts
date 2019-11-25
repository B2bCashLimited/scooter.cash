import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartComponent } from './cart.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { CartRouting } from '@b2b/modules/cart/cart-routing';

@NgModule({
  declarations: [CartComponent],
  imports: [
    CommonModule,
    SharedModule,
    CartRouting,
  ]
})
export class CartModule {
}
