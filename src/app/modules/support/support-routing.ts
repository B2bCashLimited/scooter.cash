import { RouterModule, Routes } from '@angular/router';
import { SupportComponent } from '@b2b/modules/support/support.component';

const routes: Routes = [
  {
    path: '',
    component: SupportComponent
  }
];

export const SupportRouting = RouterModule.forChild(routes);
