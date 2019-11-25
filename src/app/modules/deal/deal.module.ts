import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DealComponent } from './deal.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { DealRoutng } from '@b2b/modules/deal/deal-routing';

@NgModule({
  declarations: [DealComponent],
  imports: [
    CommonModule,
    SharedModule,
    DealRoutng,
  ]
})
export class DealModule {
}
