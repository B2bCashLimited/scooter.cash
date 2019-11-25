import { RouterModule, Routes } from '@angular/router';
import { MakeIndividualOrderComponent } from '@b2b/modules/make-individual-order/make-individual-order.component';

const routes: Routes = [
  {
    path: '',
    component: MakeIndividualOrderComponent
  }
];

export const MakeIndividualOrderRouting = RouterModule.forChild(routes);
