import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { PhoneCode, SignUp } from '@b2b/models';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { AuthService, ConfigService, LocationService, SignupValidatorsService, UserService } from '@b2b/services';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { SignupPopupComponent } from '@b2b/shared/popups/signup-popup/signup-popup.component';
import { keys } from 'lodash';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit, OnDestroy {

  first = false;
  isLoading = false;
  formError = false;
  firstStepForm: FormGroup;
  secondStepForm: FormGroup;
  lang: string;
  phoneCodes: PhoneCode[] = [];
  phoneCodeInput$ = new Subject<any>();
  showPassword = false;
  showConfirmPassword = false;
  domainData;
  // Lodash 'keys' method
  keys = keys;

  private _originalPhoneCodes: PhoneCode[];
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _matDialog: MatDialog,
    private _authService: AuthService,
    private _router: Router,
    private _actRoute: ActivatedRoute,
    private _signupValidators: SignupValidatorsService,
    private _userService: UserService,
    private _formBuilder: FormBuilder,
    private _locationService: LocationService
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.domainData = this._userService.domainData$.value;

    this.firstStepForm = this._formBuilder.group({
      lastName: [null, [Validators.required, this._signupValidators.latinLetter]],
      firstName: [null, [Validators.required, this._signupValidators.latinLetter]],
      phoneCode: [null, Validators.required],
      phone: [null, [Validators.required, Validators.pattern(/^[0-9]*$/)], this._signupValidators.phoneUnique],
      email: [null, [Validators.required, Validators.email], this._signupValidators.emailUnique],
      locationCtrl: [null, Validators.required],
    });

    this.secondStepForm = this._formBuilder.group({
      password: [null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(30),
        Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$')
      ]],
      isAgree: [false, Validators.requiredTrue],
      confirmPassword: [null, Validators.requiredTrue],
    });

    this.firstStepForm.get('locationCtrl').valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((data: any) => {
        if (data) {
          if (+data.id === 405) {
            this.lang = 'ru';
          } else if (+data.id === 374) {
            this.lang = 'ch';
          } else {
            this.lang = 'en';
          }
        }
      });

    this.getCountriesPhoneCodes();
    this._bindToInputPhoneCode();
  }

  /**
   * Show/hide password toggle
   */
  showHidePassword(evt: any): void {
    evt.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  /**
   * Show/hide confirm password toggle
   */
  showHideConfirmPassword(evt: any): void {
    evt.stopPropagation();
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    const hash = this._actRoute.snapshot.queryParams['hash'];
    const firstFormValue = this.firstStepForm.value;
    const secondFormValue = this.secondStepForm.value;

    this.isLoading = true;
    const data: SignUp = {
      client: 'front',
      email: firstFormValue.email,
      firstName: firstFormValue.firstName,
      lastName: firstFormValue.lastName,
      middleName: firstFormValue.middleName,
      password: secondFormValue.password,
      phoneCode: firstFormValue.phoneCode,
      phone: firstFormValue.phone,
      username: firstFormValue.email,
      siteName: this.domainData && this.domainData.domain,
      country: +this.firstStepForm.getRawValue().locationCtrl.id,
      hash: hash || null,
      individual: true
    };

    this._authService.signup(data)
      .pipe(
        switchMap((res: any) => {
          if (res) {
            return this._matDialog.open(SignupPopupComponent, {
              width: '320px',
              data: {
                title: 'signup.popup.thanksForRegistration',
                subtitle: 'signup.popup.sendToEmail'
              }
            }).afterClosed();
          }

          return of(false);
        })
      )
      .subscribe(() => {
        this._router.navigate(['/']);
      });
  }

  checkFirstForm() {
    if (this.firstStepForm.valid) {
      this.trig();
    }
  }

  onPhoneCodeBlur() {
    if (!this.phoneCodes || !this.phoneCodes.length) {
      this.phoneCodes = this._originalPhoneCodes;
    }
  }

  confirmPass(evt, pass) {
    if (evt.target.value !== this.secondStepForm.get(pass).value) {
      this.secondStepForm.get('confirmPassword').setErrors({ 'password': false });
    } else {
      this.secondStepForm.get('confirmPassword').setErrors(null);
    }
  }

  trig() {
    this.first = !this.first;
  }

  /**
   * Retrieves all countries with their phone codes
   */
  private getCountriesPhoneCodes(): void {
    this._locationService.getCountriesPhoneCodes()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => {
        this._originalPhoneCodes = res;
        this.phoneCodes = res;
      });
  }

  private _bindToInputPhoneCode(): void {
    this.phoneCodeInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((str: string) => {
        str = str || '';
        this.phoneCodes = this._originalPhoneCodes
          .filter(item => {
            const isText = new RegExp(/^\+?[А-яA-z]/).test(str);
            const isNumber = new RegExp(/^\+?\d/).test(str);

            if (isText) {
              return (item[this.config.name] as string).toLowerCase().includes(str.toLowerCase());
            } else if (isNumber) {
              if (str.includes('+')) {
                str = str.replace('+', '');
              }
              return item.phoneCode.toString().toLowerCase().startsWith(str.toLowerCase());
            }

            return true;
          });
      });
  }

}
