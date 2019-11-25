import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportComponent } from './support.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { SupportRouting } from '@b2b/modules/support/support-routing';

@NgModule({
  declarations: [SupportComponent],
  imports: [
    CommonModule,
    SharedModule,
    SupportRouting,
  ]
})
export class SupportModule {
}
