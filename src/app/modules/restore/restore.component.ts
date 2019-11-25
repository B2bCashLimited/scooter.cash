import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService, UserService } from '@b2b/services';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.scss']
})
export class RestoreComponent implements OnDestroy, OnInit {
  emailControl: FormControl;
  formError: string;
  loading = false;
  isEmailSent = false;
  domainData;

  private _restoreSub: Subscription;

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    private _translate: TranslateService) {
  }

  ngOnDestroy(): void { }

  ngOnInit(): void {
    this.domainData = this._userService.domainData$.value;

    this.emailControl = new FormControl(null, [
      Validators.required,
      Validators.email
    ]);
  }

  /**
   * Request email to restore password
   */
  onRestorePasswordClick() {
    this.loading = true;
    const body = {
      email: this.emailControl.value,
      siteName: this.domainData && this.domainData.domain,
    };
    this._restoreSub = this._authService.restorePassword(body)
      .subscribe(
        (res) => {
          this.isEmailSent = true;
        },
        (err) => {
          if (err.detail === 'user not found') {
            this.showError(this._translate.instant('restore.noSuchUser'));
          } else {
            this.showError(err.detail);
          }
          this.loading = false;
        });
  }

  private showError(error: string) {
    this.formError = error;
    setTimeout(() => {
      this.formError = '';
    }, 3000);
  }
}
