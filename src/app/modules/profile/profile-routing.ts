import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from '@b2b/modules/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent
  }
];

export const ProfileRouting = RouterModule.forChild(routes);
