import { TranslateService } from '@ngx-translate/core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '@b2b/services';
import { Patterns } from 'app/core/constants/patterns';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnDestroy, OnInit {
  loading = false;
  formError: string;
  key = null;
  form: FormGroup;

  private _authSub: Subscription;

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _fb: FormBuilder,
    private _translate: TranslateService,
    private _route: ActivatedRoute) {
  }

  ngOnDestroy(): void { }

  ngOnInit() {
    this.form = this._fb.group({
      password: [null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30),
        Validators.pattern(Patterns.PASSWORD)
      ]],
      confirmPassword: [null, Validators.required]
    });

    const params = this._route.snapshot.queryParams;
    this.key = params.key;
    if (!this.key) {
      this._router.navigate(['sign-in'])
        .catch((err) => console.log(err));
    }
  }

  confirmPass(evt, pass) {
    if (evt.target.value !== this.form.get(pass).value) {
      this.form.get('confirmPassword').setErrors({ 'password': false });
    } else {
      this.form.get('confirmPassword').setErrors(null);
    }
  }

  /**
   * @inheritDoc
   */
  onUpdatePasswordClick() {
    this.loading = true;
    this._authSub = this._authService.changePassword(this.form.get('password').value, this.key)
      .subscribe(
        (res) => {
          this._router.navigate(['sign-in'])
            .catch((err) => console.log(err));
        },
        (err) => {
          if (err && err.error) {
            this.showError(this._translate.instant(`restore.invalidLink`));
          }
          this.loading = false;
        });
  }

  private showError(error: string) {
    this.formError = error;
    setTimeout(() => {
      this.formError = '';
      this._router.navigate(['/restore']);
    }, 3000);
  }
}
