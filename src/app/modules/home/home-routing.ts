import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: ':parentCategoryId',
    component: HomeComponent
  },
  {
    path: ':parentCategoryId/:categoryId',
    component: HomeComponent
  }
];

export const HomeRouting = RouterModule.forChild(routes);
