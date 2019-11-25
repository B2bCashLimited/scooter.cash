import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { YandexReachGoalDirective } from '@b2b/directives/yandex-reach-goal.directive';
import { GoogleEventDirective } from '@b2b/directives/google-analytics.directive';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { MaterialModule } from '@b2b/shared/material.module';
import { SignupPopupComponent } from '@b2b/shared/popups/signup-popup/signup-popup.component';
import { CountrySelectComponent } from '@b2b/shared/country-select/country-select.component';
import { SelectCategoryComponent } from '@b2b/shared/select-category/select-category.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { B2BRatingStarComponent } from '@b2b/shared/b2b-rating-star/b2b-rating-star.component';
import { NgxGalleryModule } from 'ngx-gallery';
import { AcquiringPayformComponent } from '@b2b/shared/acquiring-payform/acquiring-payform.component';
import { OrderSuccessDialogComponent } from '@b2b/shared/popups/order-success-dialog/order-success-dialog.component';
import { ConfirmPopupComponent } from '@b2b/shared/popups/confirm-popup/confirm-popup.component';
import { OrdersShippingDialogComponent } from '@b2b/shared/popups/orders-shipping-dialog/orders-shipping-dialog.component';
import { PricesListPopupComponent } from '@b2b/shared/popups/prices-list-popup/prices-list-popup.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ProductFormCartPopupComponent } from '@b2b/shared/popups/product-form-cart-popup/product-form-cart-popup.component';
import { OWL_DATE_TIME_LOCALE, OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { AgmCoreModule } from '@agm/core';
import { ChatPopUpComponent } from '@b2b/shared/chat/popup/popup.component';
import { ChatNewComponent } from '@b2b/shared/chat/new-chat/new-chat.component';
import { ChatGroupComponent } from '@b2b/shared/chat/group-chat/group-chat.component';
import { ChatInfoComponent } from '@b2b/shared/chat/info-chat/info-chat.component';
import { BuyerSellerDialogComponent } from '@b2b/shared/chat/buyer-seller-dialog/buyer-seller-dialog.component';
import { ConfirmationDialogComponent } from '@b2b/shared/chat/confirmation-dialog/confirmation-dialog.component';
import { ChatWidgetComponent, ChatWidgetModalComponent } from '@b2b/shared/chat/widget/widget.component';
import { NotificationsComponent } from '@b2b/shared/popups/notifications/notifications.component';
import {
  ActivityCountrySelectDialogComponent
} from '@b2b/shared/popups/activity-country-select-dialog/activity-country-select-dialog.component';
import { ChatNotificationsComponent } from '@b2b/shared/popups/chat-notifications/chat-notifications.component';
import { ChatContactsComponent } from '@b2b/shared/chat/contacts/contacts.component';
import { ChatFocusDirective } from '@b2b/shared/chat/window/window.directive';
import { ChatWindowComponent } from '@b2b/shared/chat/window/window.component';
import { ActivitySelectComponent } from '@b2b/shared/activity-select/activity-select.component';
import { LinkifyPipe, PartnerLogoPipe } from '@b2b/pipes';
import { FileUploadModule } from 'ng2-file-upload';
import { WINDOW_PROVIDERS } from '@b2b/services';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    NgSelectModule,
    NgxPaginationModule,
    NgxGalleryModule,
    InfiniteScrollModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    AgmCoreModule,
    FileUploadModule,
  ],
  declarations: [
    YandexReachGoalDirective,
    GoogleEventDirective,
    SignupPopupComponent,
    CountrySelectComponent,
    SelectCategoryComponent,
    B2BRatingStarComponent,
    AcquiringPayformComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
    ChatNotificationsComponent,
    ActivityCountrySelectDialogComponent,
    ActivitySelectComponent,
    PartnerLogoPipe,
    BuyerSellerDialogComponent,
    ConfirmationDialogComponent,
    ChatContactsComponent,
    ChatGroupComponent,
    ChatInfoComponent,
    ChatNewComponent,
    ChatPopUpComponent,
    ChatWidgetModalComponent,
    ChatWidgetComponent,
    ChatFocusDirective,
    ChatWindowComponent,
    LinkifyPipe,
    NotificationsComponent,
  ],
  entryComponents: [
    SignupPopupComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
    ChatNotificationsComponent,
    ActivityCountrySelectDialogComponent,
    ChatPopUpComponent,
    ChatNewComponent,
    ChatGroupComponent,
    ChatInfoComponent,
    BuyerSellerDialogComponent,
    ConfirmationDialogComponent,
    ChatWidgetModalComponent,
    NotificationsComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    NgSelectModule,
    NgxPaginationModule,
    NgxGalleryModule,
    InfiniteScrollModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    AgmCoreModule,
    FileUploadModule,

    YandexReachGoalDirective,
    GoogleEventDirective,
    SignupPopupComponent,
    CountrySelectComponent,
    SelectCategoryComponent,
    B2BRatingStarComponent,
    AcquiringPayformComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
    ChatNotificationsComponent,
    ActivityCountrySelectDialogComponent,
    ActivitySelectComponent,
    LinkifyPipe,
    PartnerLogoPipe,
    NotificationsComponent,
  ],
  providers: [
    {provide: OWL_DATE_TIME_LOCALE, useValue: 'ru'},
    WINDOW_PROVIDERS,
  ]
})
export class SharedModule {
}
