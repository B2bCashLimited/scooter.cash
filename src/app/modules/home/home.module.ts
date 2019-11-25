import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@b2b/shared/shared.module';
import { HomeComponent } from './home.component';
import { HomeRouting } from './home-routing';
import { FiltersComponent } from './components/filters/filters.component';
import { ProductItemOneClickComponent } from './components/product-item-one-click/product-item-one-click.component';
import { SwiperModule } from 'ngx-swiper-wrapper';
import { FilterBrandsPipe } from '@b2b/pipes';

@NgModule({
  declarations: [
    HomeComponent,
    FiltersComponent,
    ProductItemOneClickComponent,
    FilterBrandsPipe,
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeRouting,
    SwiperModule,
  ]
})
export class HomeModule {
}
