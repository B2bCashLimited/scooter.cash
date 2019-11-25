import { RouterModule, Routes } from '@angular/router';
import { CompareProductsComponent } from './compare-products.component';

const routes: Routes = [
  {
    path: '',
    component: CompareProductsComponent
  }
];

export const ROUTING = RouterModule.forChild(routes);
