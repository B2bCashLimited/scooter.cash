import { RouterModule, Routes } from '@angular/router';
import { CartComponent } from '@b2b/modules/cart/cart.component';

const routes: Routes = [
  {
    path: '',
    component: CartComponent
  }
];

export const CartRouting = RouterModule.forChild(routes);
