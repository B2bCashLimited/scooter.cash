import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@b2b/services';

@Injectable()
export class CanActiveLoginGuard implements CanActivate {

  constructor(private _router: Router,
              private _authService: AuthService) {
  }

  /**
   * Deciding if a route can be activated.
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean>|Promise<boolean>|boolean {
    if (this._authService.isLoggedIn) {
      this._router.navigateByUrl('profile')
        .catch((err) => console.log(err));
      return false;
    }
    return true;
  }
}
