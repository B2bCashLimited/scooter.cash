import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignupValidatorsService {

  constructor(
    private _authService: AuthService,
  ) {
  }

  emailUnique = (control: FormControl) => this.checkUserUnique(control, 'email');

  phoneUnique = (control: FormControl) => this.checkUserUnique(control, 'phone');

  latinLetter = (control: FormControl) => {
    const latinLettersRegExp = new RegExp(/^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/);
    const value = control.value;

    return latinLettersRegExp.test(value) ? null : {latin: 'signup.errors.latin'};
  }

  private checkUserUnique(control: FormControl, name: string) {
    const value = control.value;
    return this._authService.checkUserUnique(name, value)
      .pipe(
        map(response => response.result),
        map(result => result ? null : {unique: true})
      );
  }
}
