import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, UserService } from '@b2b/services';
import { of, throwError, Subscription } from 'rxjs';
import { SignupPopupComponent } from '@b2b/shared/popups/signup-popup/signup-popup.component';
import { isPlatformBrowser } from '@angular/common';
import { clearLocalStorage, clearSessionStorage } from '@b2b/helpers/utils';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  errorMessage: string;
  isLoading = false;
  showPassword = false;

  email = new FormControl(null, [
    Validators.required,
    Validators.email
  ]);
  password = new FormControl(null, [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(30)
  ]);

  private _continueUrl: string;
  private _userConfirmSub: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _translate: TranslateService,
    private _authService: AuthService,
    private _dialog: MatDialog,
    private _userService: UserService,
    private _route: ActivatedRoute,
    private _router: Router,
  ) {
  }

  ngOnInit(): void {
    if (this._route.snapshot && this._route.snapshot.queryParams) {
      const queryParams = this._route.snapshot.queryParams;
      this._continueUrl = queryParams['continue'];

      if (queryParams && queryParams.code) {
        this.userConfirm(queryParams.code);
      }
    }
  }

  userConfirm(token) {
    if (this._userConfirmSub) {
      this._userConfirmSub.unsubscribe();
    }

    this._userConfirmSub = this._authService.userConfirm(token)
      .pipe(switchMap((res: any) => {
        if (res && res.status) {
          return this._dialog.open(SignupPopupComponent, {
            width: '320px',
            data: {
              title: 'signup.popup.thanksForRegistration',
              button: 'login.entry'
            }
          }).afterClosed();
        }
        return of(false);
      })).subscribe((res) => {
        if (res && (res.action === 'confirm')) {
          this._router.navigateByUrl('/sign-in')
            .catch((err) => console.log(err));
        } else {
          this._router.navigateByUrl('/')
            .catch((err) => console.log(err));
        }
      });
  }

  /**
   * Show/hide password toggle
   */
  showHidePassword(evt: any): void {
    evt.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  onLoginClick(): void {
    const email = this.email.value.toLowerCase();
    const password = this.password.value;

    this.isLoading = true;
    this._authService.login(email, password)
      .pipe(
        switchMap((user: any) => {
          if (!user.status) {
            return throwError(new Error(this._translate.instant('login.accountUnConfirmed')));
          }

          return of(user);
        })
      )
      .subscribe((res: any) => {
        if (res) {
          if (res.errMsg) {
            this.isLoading = false;
            this.showError(res.errMsg);
          } else if (Object.keys(res).length > 0) {
            const userCompanies = res._embedded.companies && (res._embedded.companies as any[]).length > 0;
            this._userService.userCompany$.next(userCompanies && res._embedded.companies[0] || null);
            this._router.navigate([this._continueUrl || 'profile']);
          }
        }
      }, (err: any) => {
        if (isPlatformBrowser(this.platformId)) {
          clearLocalStorage();
          clearSessionStorage();
        }

        this.isLoading = false;
        if (err && err.status === 403) {
          this.showError(this._translate.instant('login.accountDeleted'));
        } else if (err && err.status === 401) {
          this.showError(this._translate.instant('login.invalidGrant'));
        } else if (err && err.message) {
          this.showError(err.message);
        } else {
          this.showError(err);
        }
      });
  }

  /**
   * Navigate to the restore password page
   */
  onRestorePasswordClick(): void {
    this._router.navigate(['restore']);
  }

  showError(error: string) {
    this.errorMessage = error;
    setTimeout(() => {
      this.errorMessage = null;
    }, 3000);
  }

}
