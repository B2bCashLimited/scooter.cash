import { RouterModule, Routes } from '@angular/router';
import { PolicyComponent } from '@b2b/modules/policy/policy.component';

const routes: Routes = [
  {
    path: '',
    component: PolicyComponent
  }
];

export const PolicyRouting = RouterModule.forChild(routes);
