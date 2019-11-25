import {Directive, HostListener, Inject, Input} from '@angular/core';

// Кнопка регистрации - registration_button
// http://joxi.ru/EA4pvYRSo0RRGA - buy-now
// http://joxi.ru/n2Yz5JQhb0KK6A - cart
// http://joxi.ru/DmBEDYQiJ6ooyr - cart-buy
// http://joxi.ru/Vm6b7YOS4Knn9m - buy

enum GTAG_EVENT {
  'buy-now',
  'cart',
  'cart-buy',
  'buy'
}

@Directive({
  selector: '[appGoogleEvent]'
})
export class GoogleEventDirective {
  @Input() appGoogleEvent: GTAG_EVENT | GTAG_EVENT[];
  @Input() appGoogleEventCategory: 'complete' | 'button' = 'button';

  constructor() {
  }

  @HostListener('click', ['$event'])
  handleButtonClick() {
    const gtag = window['gtag'];
    if (gtag) {
      gtag('event', this.appGoogleEvent);
      console.log('GTAG EVENT', this.appGoogleEvent);
    }
    const ga = window['ga'];
    console.log('ga', ga);
    if (ga) {
      ga('send', 'event', this.appGoogleEventCategory, this.appGoogleEvent);
      console.log('GA EVENT', this.appGoogleEventCategory, this.appGoogleEvent);
    }
  }

}
