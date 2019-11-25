import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignInComponent } from './sign-in.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { SignInRouting } from './sign-in-routing';

@NgModule({
  declarations: [
    SignInComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SignInRouting,
  ]
})
export class SignInModule {
}
