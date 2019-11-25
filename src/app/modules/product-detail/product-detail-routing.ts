import { RouterModule, Routes } from '@angular/router';
import { ProductDetailComponent } from '@b2b/modules/product-detail/product-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ProductDetailComponent
  }
];

export const ProductDetailRouting = RouterModule.forChild(routes);
