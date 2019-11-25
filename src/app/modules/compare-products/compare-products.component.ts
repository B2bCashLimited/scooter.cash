import { Component, OnInit, OnDestroy } from '@angular/core';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { ProductService, ConfigService, CategoriesService } from '@b2b/services';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Location } from '@angular/common';

@Component({
  selector: 'app-compare-products',
  templateUrl: './compare-products.component.html',
  styleUrls: ['./compare-products.component.scss']
})
export class CompareProductsComponent implements OnInit, OnDestroy {
  cardsSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 'auto',
    slideToClickedSlide: true,
    grabCursor: true,
    uniqueNavElements: false,
    navigation: {
      nextEl: '.swiper-button-next.slider-next',
      prevEl: '.swiper-button-prev.slider-prev',
    },
  };

  products = [];
  categoryProperties = [];
  private _categoryId: number;

  constructor(
    public config: ConfigService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _location: Location,
    private _categoryService: CategoriesService,
    private _productService: ProductService
  ) { }

  handleClickBack() {
    this._location.back();
  }

  ngOnInit() {
    this._categoryId = this._route.snapshot.params.categoryId;

    this._categoryService.getCategoryProperties(this._categoryId).pipe(
      switchMap((properties) => {
        this.categoryProperties = properties;
        return this._productService.selectedProducts$;
      })).subscribe((products) => {
        if (!(products && products.length)) {
          this._router.navigate([`/catalog`]);
        }

        this.products = products.map((prod) => {
          if (prod.photos) {
            prod['imgSrc'] = `${this.config.serverUrl}/${prod.photos}`;
          }

          return prod;
        });
      });
  }

  deleteProd(item) {
    this.products = this.products.filter((prod) => +prod.id !== +item.id);

    if (!this.products.length) {
      this._router.navigate([`/catalog`]);
    }

  }

  getPropValue(prop, prodProps: any[]) {
    const result = prodProps.find((prodP) => prodP.id === prop.id);

    if (result) {
      return {
        value: result[`value${this.config.locale}`],
        unit: result[`value${this.config.locale}`] &&
          result._embedded && result._embedded.unit && result._embedded.unit[this.config.name] || null
      };
    }
    return result ? result[`value${this.config.locale}`] : null;
  }

  ngOnDestroy() {

  }
}
