import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { clearLocalStorage, getFromLocalStorage } from '@b2b/helpers/utils';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _router: Router,
  ) {
  }

  /**
   * Deciding if a route can be activated.
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (isPlatformBrowser(this.platformId) && getFromLocalStorage('B2B_AUTH')) {
      return true;
    } else {
      if (isPlatformBrowser(this.platformId)) {
        clearLocalStorage();
      }
      const queryParams = {continue: state.url};
      this._router.navigate(['sign-in'], {queryParams})
        .catch((err) => console.log(err));
      return false;
    }
  }
}
