import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PolicyComponent } from './policy.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { PolicyRouting } from '@b2b/modules/policy/policy-routing';

@NgModule({
  declarations: [PolicyComponent],
  imports: [
    CommonModule,
    SharedModule,
    PolicyRouting,
  ]
})
export class PolicyModule {
}
