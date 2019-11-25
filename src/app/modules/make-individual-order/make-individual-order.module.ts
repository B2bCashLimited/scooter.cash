import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@b2b/shared/shared.module';
import { MakeIndividualOrderRouting } from '@b2b/modules/make-individual-order/make-individual-order-routing';
import { MakeIndividualOrderComponent } from '@b2b/modules/make-individual-order/make-individual-order.component';
import {
  MakeIndividualSignupComponent
} from '@b2b/modules/make-individual-order/components/individual-signup/make-individual-signup.component';

@NgModule({
  declarations: [
    MakeIndividualOrderComponent,
    MakeIndividualSignupComponent,
  ],
  entryComponents: [MakeIndividualSignupComponent],
  imports: [
    CommonModule,
    SharedModule,
    MakeIndividualOrderRouting,
  ]
})
export class MakeIndividualOrderModule {
}
