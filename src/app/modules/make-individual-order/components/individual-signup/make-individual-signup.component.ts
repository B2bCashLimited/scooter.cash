import { Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { keys } from 'lodash';
import { AuthService, ConfigService, UserService } from '@b2b/services';
import { SignUp } from '@b2b/models';
import { generate } from '@b2b/helpers/password-generator';
import { setToLocalStorage, transliterate } from '@b2b/helpers/utils';
import { isPlatformBrowser } from '@angular/common';
import { Patterns } from 'app/core/constants/patterns';

@Component({
  selector: 'app-make-individual-signup',
  templateUrl: './make-individual-signup.component.html',
  styleUrls: ['./make-individual-signup.component.scss']
})
export class MakeIndividualSignupComponent implements OnInit {

  @Input() callback;
  @Input() individual;
  @Input() noCountryMode = false;     // для новой формы заказов
  @Input() noButtonMode = false;     // для новой формы заказов
  @Output() userRegistered = new EventEmitter();

  lang: string;
  phoneCode: number;
  regForm: FormGroup;
  domainData;

  // Lodash 'keys' method
  keys = keys;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public config: ConfigService,
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _userService: UserService) {
  }

  ngOnInit() {
    this.domainData = this._userService.domainData$.value;

    this.regForm = this._formBuilder.group({
      firstName: [null, Validators.required],
      phone: [null, [Validators.required, Validators.minLength(12),
      Validators.maxLength(13), Validators.pattern(Patterns.PHONE)], this.phoneUnique],
      email: [null, [Validators.required, Validators.email], this.emailUnique],
      locationCtrl: [{value: null, disabled: this.noCountryMode}, [Validators.required]],
    });

    this.regForm.get('locationCtrl').valueChanges
      .subscribe((data) => {
        if (data) {
          if (+data.id === 405) {
            this.lang = 'ru';
          } else if (+data.id === 374) {
            this.lang = 'cn';
          } else {
            this.lang = 'en';
          }
        }
      });
    this._userService.getGeoDataByIp().subscribe((res) => {
      this.phoneCode = res.phoneCode;
    });
    this.phoneValueChanges();
  }

  onSubmit(customCountryId?: number) {
    const formValue = this.regForm.value;
    const data: SignUp = {
      client: 'front',
      email: formValue.email,
      firstName: transliterate(formValue.firstName),
      password: generate(10),
      phone: formValue.phone.replace(`+${this.phoneCode}`, ''),
      phoneCode: `${this.phoneCode}`,
      siteName: this.domainData && this.domainData.domain,
      username: formValue.email,
      country: customCountryId || +this.regForm.getRawValue().locationCtrl.id,
      hash: null,
      individual: true
    };

    this._authService.signup(data)
      .pipe(
        catchError((err) => throwError(err)),
        tap((res: any) => {
          if (res && res.user) {
            if (isPlatformBrowser(this.platformId)) {
              setToLocalStorage('B2B_AUTH', res.user.auth);
            }

            this.userRegistered.emit({user: res.user, isNewUserRegistered: true});
          }
        })
      )
      .subscribe(this.callback ? this.callback() : (() => {      // выполняет callback или редиректит на главную
      })); /*this.config.showSnackBar$.next({message: this._translate.instant('errorTryLater')})*/
  }

  phoneValueChanges() {
    this.regForm.get('phone').valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((val) => {
      if (val.length && (<string>val).charAt(0) !== '+') {
        this.regForm.get('phone').setValue(`+${this.phoneCode || ''}${val}`);
      }
    });
  }

  emailUnique = (control: FormControl) => this.checkUserUnique(control, 'email');
  phoneUnique = (control: FormControl) => this.checkUserUnique(control, 'phone');

  private checkUserUnique(control: FormControl, name: string) {
    const value = control.value;
    return this._authService.checkUserUnique(name, value)
      .pipe(
        map((response: any) => response.result),
        map(result => result ? null : {unique: true})
      );
  }
}
