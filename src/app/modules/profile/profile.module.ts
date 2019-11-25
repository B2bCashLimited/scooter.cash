import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { ProfileRouting } from '@b2b/modules/profile/profile-routing';

@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule,
    SharedModule,
    ProfileRouting,
  ]
})
export class ProfileModule {
}
