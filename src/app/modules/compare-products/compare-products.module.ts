import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@b2b/shared/shared.module';
import { CompareProductsComponent } from './compare-products.component';
import { ROUTING } from './compare-products.routing';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { ProductItemComponent } from './product-item/product-item.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SwiperModule,
    ROUTING,
  ],
  declarations: [
    CompareProductsComponent,
    ProductItemComponent
  ]
})
export class CompareProductsModule {
}
