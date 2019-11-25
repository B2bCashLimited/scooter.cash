import { RouterModule, Routes } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentSuccessComponent
  }
];

export const ROUTING = RouterModule.forChild(routes);
