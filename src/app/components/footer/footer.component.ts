import { Component } from '@angular/core';
import { ConfigService } from '@b2b/services';
import { MatSelectChange } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  currentYear = new Date().getFullYear();

  constructor(
    public config: ConfigService,
    private _translateService: TranslateService,
  ) {
  }

  get lang(): string {
    return this.config.locale.toLowerCase();
  }

  onUiLanguageChangedMobile(evt: MatSelectChange) {
    this._translateService.use(evt.value);
  }
}
