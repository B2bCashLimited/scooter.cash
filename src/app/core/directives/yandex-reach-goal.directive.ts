import { Directive, HostListener, Inject, Input } from '@angular/core';
import { YANDEX_METRIKA_KEY } from '../services/yandex-metrika-key';

// Кнопка регистрации - registration_button
// http://joxi.ru/EA4pvYRSo0RRGA - buy-now
// http://joxi.ru/n2Yz5JQhb0KK6A - cart
// http://joxi.ru/DmBEDYQiJ6ooyr - cart-buy
// http://joxi.ru/Vm6b7YOS4Knn9m - buy

enum REACH_GOAL {
  'buy-now',
  'cart',
  'cart-buy',
  'buy'
}

@Directive({
  selector: '[appYandexReachGoal]'
})
export class YandexReachGoalDirective {

  @Input() appYandexReachGoal: REACH_GOAL | REACH_GOAL[];

  constructor(
    @Inject(YANDEX_METRIKA_KEY) private _yandexMetrikaKey) {
  }

  @HostListener('click', ['$event'])
  handleButtonClick() {
    const yandexMetrika = window['ym'];
    if (yandexMetrika && typeof yandexMetrika === 'function') {
      yandexMetrika(this._yandexMetrikaKey, 'reachGoal', this.appYandexReachGoal);
    }
  }
}
