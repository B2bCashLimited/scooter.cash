import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard, CanActiveLoginGuard, OrderCartHasProductsGuard } from '@b2b/guards';
import { NotFoundComponent } from '@b2b/shared/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'catalog',
    pathMatch: 'full'
  },
  {
    path: 'catalog',
    loadChildren: './modules/home/home.module#HomeModule'
  },
  {
    path: 'user-confirmation',
    loadChildren: './modules/sign-in/sign-in.module#SignInModule'
  },
  {
    path: 'restore',
    loadChildren: './modules/restore/restore.module#RestoreModule',
    canActivate: [CanActiveLoginGuard]
  },
  {
    path: 'newPassword',
    loadChildren: './modules/new-password/new-password.module#NewPasswordModule',
    canActivate: [CanActiveLoginGuard]
  },
  {
    path: 'payment-success',
    loadChildren: './modules/payment-success/payment-success.module#PaymentSuccessModule'
  },
  {
    path: 'sign-in',
    loadChildren: './modules/sign-in/sign-in.module#SignInModule',
    canActivate: [CanActiveLoginGuard]
  },
  {
    path: 'sign-up',
    loadChildren: './modules/sign-up/sign-up.module#SignUpModule',
    canActivate: [CanActiveLoginGuard]
  },
  {
    path: 'profile',
    loadChildren: './modules/profile/profile.module#ProfileModule',
    canActivate: [AuthGuard],
  },
  {
    path: 'product/:productId',
    loadChildren: './modules/product-detail/product-detail.module#ProductDetailModule'
  },
  {
    path: 'compare/:categoryId',
    loadChildren: './modules/compare-products/compare-products.module#CompareProductsModule'
  },
  {
    path: 'make-individual-order',
    loadChildren: './modules/make-individual-order/make-individual-order.module#MakeIndividualOrderModule',
    canActivate: [OrderCartHasProductsGuard]
  },
  {
    path: 'make-individual-order/fromChina',
    loadChildren: './modules/make-individual-order/make-individual-order.module#MakeIndividualOrderModule',
    canActivate: [OrderCartHasProductsGuard]
  },
  {
    path: 'deal/:lang',
    loadChildren: './modules/deal/deal.module#DealModule',
  },
  {
    path: 'policy/:lang',
    loadChildren: './modules/policy/policy.module#PolicyModule',
  },
  {
    path: 'support/:lang',
    loadChildren: './modules/support/support.module#SupportModule',
  },
  {
    path: 'contacts',
    loadChildren: './modules/contacts/contacts.module#ContactsModule',
  },
  {
    path: 'cart',
    loadChildren: './modules/cart/cart.module#CartModule',
  },
  {
    path: 'not-found',
    component: NotFoundComponent
  },
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
