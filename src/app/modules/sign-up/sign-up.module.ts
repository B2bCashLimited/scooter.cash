import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from './sign-up.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { SignUpRouting } from './sign-up-routing';

@NgModule({
  declarations: [SignUpComponent],
  imports: [
    CommonModule,
    SharedModule,
    SignUpRouting,
  ]
})
export class SignUpModule {
}
