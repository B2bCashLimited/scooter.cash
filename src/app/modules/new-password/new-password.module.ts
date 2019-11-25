import { NgModule } from '@angular/core';
import { NewPasswordRouting } from './new-password.routing';
import { NewPasswordComponent } from './new-password.component';
import { SharedModule } from '@b2b/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    NewPasswordRouting
  ],
  declarations: [
    NewPasswordComponent
  ]
})
export class NewPasswordModule {
}
