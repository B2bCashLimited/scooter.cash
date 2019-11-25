import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '@b2b/services';

@Pipe({
  name: 'partnerLogo'
})
export class PartnerLogoPipe implements PipeTransform {

  constructor(private _config: ConfigService) {
  }

  transform(value: any, args?: any): any {
    const {serverUrl} = this._config;
    if (value.logo && value.logo[0] && value.logo[0].link) {
      return serverUrl + value.logo[0].link;
    } else if (value.individual) {
      return '../assets/img/stubs/individual.png';        // заглушка для физ лиц
    } else {
      return '../assets/img/stubs/nologo.png';        // заглушка для компаний
    }
  }
}
