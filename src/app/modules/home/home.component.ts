import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { MarketplaceCategory } from '@b2b/models';
import { PageEvent } from '@angular/material';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { Brands } from '@b2b/constants';
import { ProductService, SeoService, ConfigService, CategoriesService } from '@b2b/services';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '@b2b/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  category: MarketplaceCategory;
  parentCategory: MarketplaceCategory;
  products = [];
  pageEvent: PageEvent;
  isMobile = false;
  brands: {name: string, src: string}[] = [];
  selectedManufacturer: string;
  isMobileFilterOpen = false;
  isSortPriceAsc = true;
  sortedBy: {field: string, dir: boolean};
  currentCart: Map<any, any>;
  checkedProducts = [];
  seoH1 = '';
  seoTxt: SafeHtml = '';
  hideFilters = false;
  parentCategoryId: string;
  categoryId: string;
  hostName = environment.production ? location.hostname : 'scooter.cash';
  marketplaceChildCategories: MarketplaceCategory[] = [];
  isSearchForAllCategories$ = this._productService.isSearchForAllCategories$;
  selectedProducts = [];

  bannerSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 1,
    grabCursor: true,
    uniqueNavElements: false,
    navigation: {
      nextEl: '.swiper-button-next.banner-next',
      prevEl: '.swiper-button-prev.banner-prev',
    },
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    }
  };

  cardsSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 4,
    spaceBetween: 20,
    navigation: {
      nextEl: '.swiper-button-next.card-next',
      prevEl: '.swiper-button-prev.card-prev',
    },
    freeMode: true,
    grabCursor: true,
    slideToClickedSlide: true,
    breakpoints: {

      1120: {
        slidesPerView: 10,
        spaceBetween: 1
      },
      992: {
        slidesPerView: 8,
        spaceBetween: 1
      },
      767: {
        slidesPerView: 6,
        spaceBetween: 1
      },
      560: {
        slidesPerView: 4,
        spaceBetween: 1
      },
      479: {
        slidesPerView: 2.5,
        spaceBetween: 1
      }
    }
  };

  cardsSwiperConfigTwo: SwiperConfigInterface = {
    slidesPerView: 4,
    spaceBetween: 20,
    navigation: {
      nextEl: '.swiper-button-next.b-next',
      prevEl: '.swiper-button-prev.b-prev',
    },
    freeMode: true,
    grabCursor: true,
    slideToClickedSlide: true,
    breakpoints: {

      1120: {
        slidesPerView: 10,
        spaceBetween: 1
      },
      992: {
        slidesPerView: 8,
        spaceBetween: 1
      },
      767: {
        slidesPerView: 6,
        spaceBetween: 1
      },
      560: {
        slidesPerView: 4,
        spaceBetween: 1
      },
      479: {
        slidesPerView: 2.5,
        spaceBetween: 1
      }
    }
  };

  brandsSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 'auto',
    slideToClickedSlide: true,
    grabCursor: true,
    uniqueNavElements: false,
    navigation: {
      nextEl: '.swiper-button-next.brands-next',
      prevEl: '.swiper-button-prev.brands-prev',
    },
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _breakpointObserver: BreakpointObserver,
    private _productService: ProductService,
    private _seo: SeoService,
    private _sanitizer: DomSanitizer,
    private _categoriesService: CategoriesService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.parentCategoryId = this._route.snapshot.params.parentCategoryId;
    this.categoryId = this._route.snapshot.params.categoryId;
    this.currentCart = this._productService.cartedProducts;

    if (this.parentCategoryId && !this._categoriesService.marketplaceCategory$.value) {
      this._categoriesService.marketplaceCategory$.next({categoryId: this.parentCategoryId});
    }

    this._route.params
      .pipe(
        filter((res: any) => res.categoryId),
        switchMap((res: any) => {
          this.categoryId = res.categoryId;
          this.hideFilters = this.categoryId && this.categoryId === 'all';

          if (this.hideFilters) {
            return this._getMarketplaceChildCategories();
          }

          return of(null);
        }),
        filter(res => !!res),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(res => this.marketplaceChildCategories = res.filter((mpc) => !!mpc.countProducts));

    this._breakpointObserver        // подписка на ширину - для скрытия на мобилах
      .observe(['(max-width: 991px)'])
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((state: BreakpointState) => {
        this.isMobile = state.matches;

        if (!this.isMobile) {
          this.isMobileFilterOpen = false;
        }
      });

    this._categoriesService.marketplaceCategory$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: MarketplaceCategory) => this.parentCategory = res);

    this._seo.seoH1$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.seoH1 = res);

    this._seo.seoTxt$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.seoTxt = this._sanitizer.bypassSecurityTrustHtml(res));
  }

  openMobileFilter(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  onLoadedProducts(evt): void {
    this.products = evt;
  }

  onPageEventChanged(evt: PageEvent): void {
    this.pageEvent = evt;
  }

  pageChanged(evt): void {
    this.pageEvent.pageIndex = evt;
  }

  onManufacturersLoaded(manufacturersList: string[]): void {
    this.brands = [];

    if (manufacturersList && manufacturersList.length > 0) {
      const filteredItems = [];
      manufacturersList.forEach(manufact => {
        const brand = Brands.find(value => value.name.toLowerCase() === (<string>manufact).toLowerCase());
        if (brand) {
          filteredItems.push(brand);
        }
      });
      this.brands.push(...filteredItems);
    }
  }

  onSelectedManufacturer(brandName: string): void {
    this.selectedManufacturer = brandName;
  }

  sortByPrice(): void {
    this.isSortPriceAsc = !this.isSortPriceAsc;
    this.sortedBy = {
      field: 'price',
      dir: this.isSortPriceAsc
    };
  }

  onCategorySelected(evt: MarketplaceCategory): void {
    this.category = evt;
    this.hideFilters = !evt;

    if (!evt) {
      this.seoH1 = '';
      this.seoTxt = '';
    }
  }

  onComparableItemSelected(evt: boolean, item) {
    if (evt) {
      this.selectedProducts.push(item);
    } else {
      this.selectedProducts = this.selectedProducts.filter((selProd) => +selProd.id === +item.id);
    }
  }

  compareSelected(): void {
    this._productService.selectedProducts$.next(this.selectedProducts);
    this._router.navigate([`/compare`, this.categoryId]);
  }

  openChildCategoryProducts(item: MarketplaceCategory): void {
    this._router.navigate(
      [`/catalog/${this.parentCategory && this.parentCategory.categoryId || this.parentCategoryId}/${item.categoryId}`],
      {queryParamsHandling: 'merge'});
  }

  showAllCategories(): void {
    this.isSearchForAllCategories$.next(false);
  }

  private _getMarketplaceChildCategories(): Observable<MarketplaceCategory[]> {
    const data: any = {
      marketplace: this.hostName,
      category: this.parentCategory && this.parentCategory.categoryId || this.parentCategoryId,
      card: 1
    };

    return this._categoriesService.getMarketplaceChildCategories(data);
  }
}
