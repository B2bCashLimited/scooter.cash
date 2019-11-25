import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductService } from '@b2b/services';

@Injectable()
export class OrderCartHasProductsGuard implements CanActivate {

  constructor(
    private _productService: ProductService,
    private _router: Router,
  ) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const currentCart = this._productService.cartedProducts;

    if (currentCart.size) {
      return true;
    } else {
      this._router.navigate(['']);
      return false;
    }
  }
}
