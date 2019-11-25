import { Injectable } from '@angular/core';
import { environment } from '@b2b/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  apiUrl = environment.apiUrl;
  chatUrl = environment.chatUrl;
  frontUrl = environment.front;
  clientUrl = environment.client;
  locale = environment.defaultLanguage;
  name = `name${this.locale}`;
  oauthUrl = environment.oauthUrl;
  serverUrl = environment.serverUrl;

  constructor() {
  }
}
