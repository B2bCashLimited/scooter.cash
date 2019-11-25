import { RouterModule, Routes } from '@angular/router';
import { DealComponent } from '@b2b/modules/deal/deal.component';

const routes: Routes = [
  {
    path: '',
    component: DealComponent
  }
];

export const DealRoutng = RouterModule.forChild(routes);
