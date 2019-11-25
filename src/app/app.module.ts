import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '@b2b/shared/material.module';
import { GtagModule } from 'angular-gtag';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '@b2b/environments/environment';
import { YANDEX_METRIKA_KEY } from './core/services/yandex-metrika-key';
import { GTAG_KEY } from './core/services/gtag-key';
import { NgxMaskModule } from 'ngx-mask';
import { HeaderComponent } from '@b2b/components/header/header.component';
import { FooterComponent } from '@b2b/components/footer/footer.component';
import { HttpInterceptorService } from './core/services/http-interceptor.service';
import { AuthGuard, CanActiveLoginGuard, OrderCartHasProductsGuard } from '@b2b/guards';
import { CurrentLocationPopupComponent } from '@b2b/popups/current-location-popup/current-location-popup.component';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { AgmCoreModule } from '@agm/core';
import { SelectMainCategoryComponent } from '@b2b/components/select-main-category/select-main-category.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotFoundComponent } from '@b2b/shared/not-found/not-found.component';

export class CustomTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return from(import(`../assets/i18n/${lang.toLowerCase()}.json`));
  }
}

const GUARDS = [
  AuthGuard,
  CanActiveLoginGuard,
  OrderCartHasProductsGuard,
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    CurrentLocationPopupComponent,
    SelectMainCategoryComponent,
    NotFoundComponent,
  ],
  entryComponents: [CurrentLocationPopupComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserModule.withServerTransition({appId: 'scooter.cash'}),
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    AppRoutingModule,
    SwiperModule,
    NgSelectModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient]
      }
    }),
    GtagModule.forRoot({trackingId: environment.gtagKey, trackPageviews: true}),
    AgmCoreModule.forRoot({
      apiKey: environment.agmApiKey,
      libraries: ['places']
    }),
    NgxMaskModule.forRoot()
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true},
    {provide: YANDEX_METRIKA_KEY, useValue: environment.yandexMetrikaKey},
    {provide: GTAG_KEY, useValue: environment.gtagKey},
    ...GUARDS,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
