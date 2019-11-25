import { Inject, Injectable } from '@angular/core';
import { YANDEX_METRIKA_KEY } from './yandex-metrika-key';
import { GTAG_KEY } from './gtag-key';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    @Inject(YANDEX_METRIKA_KEY) private _yandexMetrikaKey,
    @Inject(GTAG_KEY) private _gtagKey) {
  }

  /**
   * Load and append analytics into index.html
   */
  loadAnalytics(): void {
    this.loadYandexMetrika();
  }

  loadSslInstallation(): void {
    appendScript(`//seal.geotrust.com/getgeotrustsslseal?host_name=www.promo.b2b.cash&amp;size=S&amp;lang=en"`);
  }

  /**
   * Append Yandex Metrika to head
   */
  private loadYandexMetrika(): void {
    appendScript('//mc.yandex.ru/metrika/tag.js');
    const cb = 'ym';
    const win: Window = window;
    win[cb] = win[cb] || function () {
      (win[cb].a = win[cb].a || []).push(arguments);
    };
    win[cb].l = 1 * (new Date() as any);
    win[cb](this._yandexMetrikaKey, 'init', {
      id: this._yandexMetrikaKey,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true
    });
  }

  /**
   * Append Google Analitics to head
   */
  private globalSiteTag() {
    const win: any = window;
    const gtag = (...args) => (win.dataLayer = win.dataLayer || []).push(args);
    gtag('js', new Date());
    gtag('config', this._gtagKey, { 'send_page_view': false });
    appendScript(`//www.googletagmanager.com/gtag/js?id=${this._gtagKey}`);
  }
}

function appendScript(file: string, parent = 'body', id?: string): void {
  const win: Window = window;
  const protocol = win.location ? win.location.protocol || '' : '';
  file = ((/^https/).test(protocol) ? 'https:' : 'http:') + file;
  const elem = document.getElementsByTagName(parent)[0];
  const script: HTMLScriptElement = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = file;
  if (id && id.length > 0) {
    script.id = id;
  }
  elem.appendChild(script);
}



