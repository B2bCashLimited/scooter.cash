import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { CategoryProperty, City, DecodeData, MarketplaceCategory, Unit } from '@b2b/models';
import { ActivatedRoute, Router } from '@angular/router';
import { getFromLocalStorage, getFromSessionStorage, removeEmptyProperties, seoUrlStringReplacer } from '@b2b/helpers/utils';
import { CategoriesService, ConfigService, LocationService, ProductService, SeoService, UnitsService, UserService } from '@b2b/services';
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { CategoryPropertySpecialFields, UnitTypes } from '@b2b/constants';
import { environment } from '@b2b/environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent implements OnInit, OnDestroy {

  @Input() set pageChanged(value: number) {
    if (value) {
      this.pageEvent.pageIndex = value;
      this.search(value);
    }
  }

  @Input() set selectedManufacturer(value: string) {
    if (value) {
      this.searchKeyProductManufacturer = value;
      this.search(1);
    }
  }

  @Input() set sort(value: {field: string, dir: boolean}) {
    if (value) {
      this.sortedBy = value;
      this.search(1);
    }
  }

  @Output() loadedProducts: EventEmitter<any> = new EventEmitter<any>();
  @Output() pageEventChanged: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();
  @Output() manufacturersLoaded: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() categorySelected: EventEmitter<MarketplaceCategory> = new EventEmitter<MarketplaceCategory>();

  category: MarketplaceCategory;
  marketplaceChildCategories: MarketplaceCategory[] = [];
  parentCategoryId: number = this._route.snapshot.params.parentCategoryId;
  searchKeyCity: number;
  mainProperties: CategoryProperty[] = [];
  properties: CategoryProperty[] = [];
  manufacturers: string[] = [];
  models: string[] = [];
  searchKeyProperties = {};
  products = [];
  searchKeyProductManufacturer: string;
  modelName: string;
  searchKeyName: string;
  cityFromStorage: any;
  searchKeyCityName = '';
  cities = [];
  showCityPopup = true;
  isPending = false;
  pageNumbers: number[] = [1];
  units: Unit[] = [];
  currencies = [];
  currencyPriceForMap: any;
  disabledCheckboxesTooltip = '';
  disableCheckboxes = false;
  currentCart: any;
  cityFromLocationService: City;
  defaultH1 = '';
  defaultDesc = '';
  defaultTitle = '';
  defaultKeywords = '';
  defaultText = '';
  seoH1 = '';
  seoTxt = '';
  domainData: any;
  hostName = environment.production ? location.hostname : 'scooter.cash';
  queryParamsUtm = isPlatformBrowser(this.platformId) && getFromLocalStorage('UTM');

  pageEvent: PageEvent = {
    pageSize: 20,
    pageIndex: 1,
    length: 25
  };

  searchKeyPrice = {
    from: '',
    to: '',
    priceForUnit: null,
    currency: null
  };

  sortedBy: {field: string, dir: boolean} | null = {
    field: 'price',
    dir: true
  };

  readonly PRICES_THRESHOLD = 20;   // начальное кол-во отображаемых цен
  readonly QUERY_PARAMS = {
    NAME: 'name',
    COUNTRY: 'country',
    CITY: 'city',
    PRICEFROM: 'priceFrom',
    PRICETO: 'priceTo',
    MANUFACTURER: 'manufacturer',
    MODEL: 'model',
    PAGE: 'page',
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();
  private _productSub: Subscription;

  constructor(
    public config: ConfigService,
    @Inject(PLATFORM_ID) private platformId: any,
    private _router: Router,
    private _route: ActivatedRoute,
    private _categoriesService: CategoriesService,
    private _productService: ProductService,
    private _userService: UserService,
    private _unitsService: UnitsService,
    private _translate: TranslateService,
    private _locationService: LocationService,
    private _seo: SeoService,
  ) {
  }

  get priceForUnitId() {
    return this.searchKeyPrice.priceForUnit && this.searchKeyPrice.priceForUnit.id;
  }

  get currencyId() {
    return this.searchKeyPrice.currency && this.searchKeyPrice.currency.id;
  }

  get currentCartCurrency() {
    let currency = null;
    this.currentCart.forEach((value, key) => {
      if (!currency && key && value && value[0]) {
        currency = value[0].currency;
      }
    });
    return currency;
  }

  get priceForUnits() {
    if (this.currencyId) {
      const unitIds = this.currencyPriceForMap.find(value => +Object.keys(value)[0] === this.currencyId)[this.currencyId];
      return this._unitsService.getUnitsByIds(<number[]>unitIds);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.domainData = this._userService.domainData$.value;
    let geoDataReq = of(this._userService.userGeoData$.value);

    if (!this._userService.userGeoData$.value) {
      geoDataReq = this._userService.getGeoDataByIp();
    }

    if (!this.parentCategoryId) {
      this._categoriesService.marketplaceCategory$
        .pipe(
          filter(res => !!res),
          takeUntil(this._unsubscribe$)
        ).subscribe((res: MarketplaceCategory) => this.parentCategoryId = +res.categoryId);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.cityFromStorage = getFromSessionStorage('B2B_MARKET_CITY');
    }

    this.showCityPopup = !this.cityFromStorage;
    this.currentCart = this._productService.cartedProducts;

    this._locationService.selectedCity$
      .pipe(
        filter(res => !!res),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(res => {
        this.cityFromLocationService = res;
        this.searchKeyCity = this.cityFromLocationService.id;
        this.searchKeyCityName = this.cityFromLocationService[this.config.name];
        this.search();
      });

    if (this.cityFromStorage) {
      this.cities = [this.cityFromStorage];
    } else {
      geoDataReq
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(geoData => {
          if (geoData && geoData.city && geoData.city.id) {
            // получаем список городов, чтобы заполнить город по умолчанию позже по id
            this.cities = [geoData.city];
          }
        });
    }

    this._locationService.searchKeyName$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => {
        this.searchKeyName = res;
        this.search(1);
      });

    this._route.params
      .pipe(
        switchMap(params => {
          this._clearList();

          if (params.categoryId) {
            const parentCategoryId = params.parentCategoryId;
            const categoryId = params.categoryId;
            const data: any = {
              marketplace: (this.domainData && this.domainData.domain) || this.hostName,
              category: parentCategoryId,
              card: 1
            };

            return this._categoriesService.getMarketplaceChildCategories(data)
              .pipe(
                switchMap((categories: MarketplaceCategory[]) => {
                  this.marketplaceChildCategories = categories;
                  this.category = categories.find(value => +value.categoryId === +categoryId);

                  if (categoryId !== 'all' && this.category) {
                    return forkJoin(
                      this._categoriesService.getCategoryProperties(this.category.categoryId),
                      this.getUnits(this.category.categoryId))
                      .pipe(
                        map(([value]) => {
                          this.mainProperties = value.slice(0, 3);

                          if (value.length > 3) {
                            this.properties = value.slice(3);
                          }
                        }),
                        catchError(() => of(null)),
                        switchMap(() => {
                          this._getPropsFromParams();

                          if (this.cityFromStorage && this.searchKeyCity) {
                            this.searchKeyCityName = this.cityFromStorage[this.config.name];
                          } else if (this.cityFromLocationService && this.searchKeyCity) {
                            this.searchKeyCityName = this.cityFromLocationService[this.config.name];
                          }

                          return forkJoin(
                            this._getProductSearchResults(),
                            this._getPropertyItems(),
                            this.seoUpdate()
                          );
                        })
                      );
                  } else if (categoryId === 'all') {
                    const obj: any = {
                      marketplace: (this.domainData && this.domainData.domain) || this.hostName,
                      category: parentCategoryId
                    };
                    return this._categoriesService.getBrandsForAllCategories(obj)
                      .pipe(
                        switchMap((brands: {value: string, count: number}[]) => {
                          const manufacturers: string[] = [];
                          brands.forEach(brand => manufacturers.push(brand.value));
                          this.manufacturersLoaded.emit(manufacturers);

                          return of([]);
                        }));
                  }

                  return of([]);
                }),
              );
          } else {
            if (this.cityFromStorage) {
              this.searchKeyCity = this.cityFromStorage.id;
              this.searchKeyCityName = this.cityFromStorage[this.config.name];
              this.cities = [this.cityFromStorage];
              geoDataReq = of(null);
            } else if (this.cityFromLocationService) {
              this.searchKeyCity = this.cityFromLocationService.id;
              this.searchKeyCityName = this.cityFromLocationService[this.config.name];
              geoDataReq = of(null);
            }

            return geoDataReq
              .pipe(map((geoData: any) => {
                // инит city, далее меняется через app-current-location-popup
                if (geoData && geoData.city && geoData.city.id) {
                  this.searchKeyCity = geoData.city.id;
                  this.searchKeyCityName = geoData.city[this.config.name];
                  this.cities = [geoData.city];
                }
              }), catchError(() => of(null)));
          }
        })
      ).subscribe();
  }

  search(page = this.pageEvent.pageIndex, updateSeoTags = false) {
    if (this._productSub && !this._productSub.closed) {
      this._productSub.unsubscribe();
    }

    let seoReq$ = of(null);
    if (updateSeoTags) {
      seoReq$ = this.seoUpdate();
    }

    if (this.category) {
      this._productSub = forkJoin(this._getProductSearchResults(page), this._getPropertyItems(), seoReq$)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe();
    } else if (!this.category && this.marketplaceChildCategories && this.marketplaceChildCategories.length > 0) {
      this._productService.isSearchForAllCategories$.next(true);
      this._productSub = forkJoin(this.getUnits(this.marketplaceChildCategories[0].categoryId),
        this._getProductSearchResults(page, true), seoReq$)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe();
    }
  }

  categoryChanged(evt: MarketplaceCategory): void {
    this._seo.seoH1$.next(null);
    this.searchKeyProductManufacturer = null;
    this.manufacturers = [];
    this.manufacturersLoaded.emit(this.manufacturers);
    this.pageEvent.pageIndex = 1;
    this._onCategoryChanged(evt);
    this.categorySelected.emit(evt);
  }

  seoUpdate(): Observable<any> {
    const seoPropsString = JSON.stringify(this.createSeoPropsArray());
    return this._seo.findSeoMetaData(+this.category.categoryId, 3, seoPropsString)
      .pipe(
        map(value => {
          const decodeData: DecodeData = {
            categoryName: this.category[this.config.name],
            cityName: this.searchKeyCityName,
            countryName: '',
            h1: '',
            manufacturerName: this.searchKeyProductManufacturer,
            modelName: this.modelName,
            properties: this.properties,
            searchKeyProperties: this.searchKeyProperties,
            title: value[`titleName${this.config.locale}`]
          };
          // сохраняем дефолтные значения (без пропертей), чтобы откатить к ним если че
          if (seoPropsString === '[]') {
            // h1
            if (value[`headerName${this.config.locale}`]) {
              this.defaultH1 = this._seo.decodeMeta(value[`headerName${this.config.locale}`], decodeData);
            } else {
              this.defaultH1 = this.category[this.config.name];
            }
            // description
            if (value[`metaDescName${this.config.locale}`]) {
              this.defaultDesc = this._seo.decodeMeta(value[`metaDescName${this.config.locale}`], decodeData);
            }
            // title
            if (value[`titleName${this.config.locale}`]) {
              this.defaultTitle = this._seo.decodeMeta(value[`titleName${this.config.locale}`], decodeData);
            }
            // keywords
            if (value[`keywordsName${this.config.locale}`]) {
              this.defaultKeywords = this._seo.decodeMeta(value[`keywordsName${this.config.locale}`], decodeData);
            }
            // text
            if (value[`descriptionName${this.config.locale}`]) {
              this.defaultText = this._seo.decodeMeta(value[`descriptionName${this.config.locale}`], decodeData);
            }
          }
          this.setMetaDataFromFindSeoObj(value, decodeData);
        }), catchError(() => of(null)));
  }

  createSeoPropsArray(): any[] {
    const res = [];
    if (this.searchKeyProductManufacturer) {
      res.push({manufacturer: this.searchKeyProductManufacturer});
    }
    if (this.modelName) {
      res.push({modelName: this.modelName});
    }
    this.properties.forEach(value => {
      if (this.searchKeyProperties[value.id]) {
        const obj = {};
        obj[`${value.id}`] = this.searchKeyProperties[value.id];
        res.push(obj);
      }
    });
    return res;
  }

  setMetaDataFromFindSeoObj(seoData, decodeData: DecodeData) {
    if (seoData[`headerName${this.config.locale}`]) {
      this.seoH1 = this._seo.decodeMeta(seoData[`headerName${this.config.locale}`], decodeData);
      this._seo.seoH1$.next(this.seoH1);
    } else {
      this.seoH1 = this.defaultH1 || this.category[this.config.name];
      this._seo.seoH1$.next(this.seoH1);
    }
    decodeData.h1 = this.seoH1;
    if (seoData[`metaDescName${this.config.locale}`]) {
      this._seo.description$.next(this._seo.decodeMeta(seoData[`metaDescName${this.config.locale}`], decodeData));
    } else {
      this.defaultDesc ? this._seo.description$.next(this.defaultDesc)
        : this._seo.setDescriptionWTranslate('filters.orderProductFormSearchDescSuffix', this.seoH1);
    }
    if (seoData[`titleName${this.config.locale}`]) {
      this._seo.title$.next(this._seo.decodeMeta(seoData[`titleName${this.config.locale}`], decodeData));
    } else {
      this.defaultTitle ? this._seo.title$.next(this.defaultTitle)
        : this._seo.setTitleWTranslate('filters.orderProductFormSearchTitleSuffix', this.seoH1);
    }
    if (seoData[`keywordsName${this.config.locale}`]) {
      this._seo.keywords$.next(this._seo.decodeMeta(seoData[`keywordsName${this.config.locale}`], decodeData));
    } else {
      this.defaultKeywords ? this._seo.keywords$.next(this.defaultKeywords) : this._seo.updateMainKeywords();
    }
    if (seoData[`descriptionName${this.config.locale}`]) {
      this.seoTxt = this._seo.decodeMeta(seoData[`descriptionName${this.config.locale}`], decodeData);
      this._seo.seoTxt$.next(this.seoTxt);
    } else {
      this.seoTxt = this.defaultText || '';
      this._seo.seoTxt$.next(this.seoTxt);
    }
  }

  private _onCategoryChanged(category: MarketplaceCategory): void {
    let params: any = {};

    if (this.searchKeyCity) {
      params['city'] = this.searchKeyCity;
    }

    params[this.QUERY_PARAMS.MANUFACTURER] = null;
    params[this.QUERY_PARAMS.MODEL] = null;

    if (category) {
      this._categoriesService.getCategoryProperties(category.categoryId)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe((res: CategoryProperty[]) => {
          this.mainProperties = res.slice(0, 3);

          if (res.length > 3) {
            this.properties = res.slice(3);
          }
        });
    }

    if (this.queryParamsUtm) {
      params = {
        ...params,
        ...JSON.parse(this.queryParamsUtm)
      };
    }

    this._router.navigate([`../${category && category.categoryId || 'all'}`],
      {relativeTo: this._route, queryParams: params, queryParamsHandling: 'merge'});

    this.category = category;
  }

  private _getProductSearchResults(page = this.pageEvent.pageIndex, topLevelSearch: boolean = false): Observable<any> {
    this.isPending = true;
    this.products = [];
    const categoryId: string = this._route.snapshot.params.categoryId;
    const sendPropFilter = [];
    let qParams: any = {};

    qParams[this.QUERY_PARAMS.NAME] = this.searchKeyName || null;
    qParams[this.QUERY_PARAMS.CITY] = this.searchKeyCity && this.searchKeyCity.toString() || null;
    qParams[this.QUERY_PARAMS.PRICEFROM] = this.searchKeyPrice && this.searchKeyPrice.from || null;
    qParams[this.QUERY_PARAMS.PRICETO] = this.searchKeyPrice && this.searchKeyPrice.to || null;
    qParams[this.QUERY_PARAMS.MANUFACTURER] = this.searchKeyProductManufacturer || null;
    qParams[this.QUERY_PARAMS.MODEL] = this.modelName || null;

    if (this.properties) {
      this.properties.forEach(value => {
        const searchPropValue = this.searchKeyProperties[value.id];
        if (searchPropValue) {    // если указано значение в форме то запихиваем в запрос
          qParams[seoUrlStringReplacer(value.nameEn.toLowerCase())] = searchPropValue;    // queryParam
          sendPropFilter.push({
            property: value.id,
            value: searchPropValue
          });
        }
      });
    }

    if (this.mainProperties) {
      this.mainProperties.forEach(value => {
        const searchPropValue = this.searchKeyProperties[value.id];
        if (searchPropValue) {    // если указано значение в форме то запихиваем в запрос
          qParams[seoUrlStringReplacer(value.nameEn.toLowerCase())] = searchPropValue;    // queryParam
          sendPropFilter.push({
            property: value.id,
            value: searchPropValue
          });
        }
      });
    }

    if (this.sortedBy) {
      qParams['sortedBy'] = this.sortedBy.field;
      qParams['sortDir'] = this.sortedBy.dir ? 'ASC' : 'DESC';
    }

    if (this.pageEvent.pageIndex > 1) {
      qParams[this.QUERY_PARAMS.PAGE] = this.pageEvent.pageIndex;
    } else {
      qParams[this.QUERY_PARAMS.PAGE] = null;
    }

    if (this.queryParamsUtm) {
      qParams = {
        ...qParams,
        ...JSON.parse(this.queryParamsUtm)
      };
    }

    if (JSON.stringify(removeEmptyProperties(qParams)) !== JSON.stringify(this._route.snapshot.queryParams)) {
      this._router.navigate([`../${categoryId === 'all' ? 'all' : this.category.categoryId}`],
        {
          relativeTo: this._route,
          queryParams: qParams,
          queryParamsHandling: 'merge'
        });
    }

    const query: any = {
      category: categoryId === 'all'
        ? this.marketplaceChildCategories && this.marketplaceChildCategories.length > 0 && this.marketplaceChildCategories[0].categoryId
        : (this.category && this.category.categoryId),
      city: this.searchKeyCity,
      priceFrom: this.searchKeyPrice.from,
      priceTo: this.searchKeyPrice.to,
      name: this.searchKeyName,
      pricePerUnit: this.priceForUnitId,
      manufacturer: this.searchKeyProductManufacturer,
      model: this.modelName,
      lang: this.config.locale,
      status: 4,
      page: page,
      limit: this.pageEvent.pageSize,
      properties: JSON.stringify(sendPropFilter),
      individual: 1,
      currencyPerUnit: this.currencyId,
      group: 'supplier',
      marketplace: (this.searchKeyName && (this.domainData && this.domainData.domain || this.hostName))
        || topLevelSearch && this.hostName || null
    };

    if (this.sortedBy) {
      query['orderField'] = this.sortedBy.field;
      query['orderDir'] = this.sortedBy.dir ? 'ASC' : 'DESC';
    }

    return this._productService.searchProducts(query).pipe(
      map(({pager, data}) => {
        this.isPending = false;
        this.pageEvent = {
          length: pager.totalItems,
          pageIndex: pager.currentPage,
          pageSize: pager.perPage
        };
        this.pageEventChanged.emit(this.pageEvent);
        this.pageNumbers = this._getPageNumbers(this.pageEvent);

        if (data) {
          this.products = data;

          this.products.forEach((product: any) => {
            const currPerUnit = this.units.find(unit => unit.id === product.currencyPerUnit);
            if (currPerUnit) {
              product['currencyPerUnitName'] = currPerUnit[this.config.name];
            }
          });
        }
        this.products.forEach(value => {
          if (value.productPrices) {
            value.productPrices = value.productPrices.sort((a, b) => Number(a.price) - Number(b.price));
            value.price = value.productPrices[0].price;
            value.rating = value.productPrices[0].rating;
            value.threshold = this.PRICES_THRESHOLD;
          }
          value.showProperties = false;
          value.category = this.category || this.parentCategoryId ? 'all' : null;
          value.currency = this.searchKeyPrice.currency;
          value.priceFor = this.searchKeyPrice.priceForUnit;
          value.properties = value.properties.map(prop => {
            const mainProp = this.mainProperties.find(val => +prop.categoryPropertyId === +val.id);
            const secProp = this.properties.find(val => +prop.categoryPropertyId === +val.id);
            if (mainProp) {
              return {...prop, ...mainProp};
            } else if (secProp) {
              return {...prop, ...secProp};
            }

            return prop;
          });

          this.mainProperties.forEach(prop => {
            if (+value.priceFor.id !== UnitTypes.PIECES && prop.special === CategoryPropertySpecialFields.WITH_FORMULS) {
              const countProp = value.properties.find(value1 => +value1.categoryPropertyId === +prop.id); // проп. для пересч. м2 в штуки
              if (countProp) {
                value.countUnit = Number(countProp.valueEn);    // множитель пересчета в штуки
              }
            }
          });

          this.properties.forEach(prop => {
            if (+value.priceFor.id !== UnitTypes.PIECES && prop.special === CategoryPropertySpecialFields.WITH_FORMULS) {
              const countProp = value.properties.find(value1 => +value1.categoryPropertyId === +prop.id); // проп. для пересч. м2 в штуки
              if (countProp) {
                value.countUnit = Number(countProp.valueEn);    // множитель пересчета в штуки
              }
            }
          });
        });

        if (!this.products[0]) {
          this.products[0] = 'notFound';
        }

        this.loadedProducts.emit(this.products);
      }), catchError(() => {
        this.isPending = false;
        this.products[0] = 'notFound';
        return of([]);
      }));
  }

  getUnits(categoryId): Observable<any> {
    this.currencies = [];
    this.searchKeyPrice.currency = null;
    this.searchKeyPrice.priceForUnit = null;

    const query: any = {
      category: categoryId,
      individual: 1,
      group: 'supplier',
      marketplace: (this.domainData && this.domainData.domain) || this.hostName,
    };
    const obs = forkJoin(
      this._unitsService.getCurrencyAndPricePerUnit(query),
      this._unitsService.units.length ? of(null) : this._unitsService.getUnits()     // загружаем юнитсы, если их еще нет
    );
    return obs
      .pipe(
        map(res => {
          this.currencyPriceForMap = res[0];     // {curId: [id, id], ...}[]   связывает валюты и priceForUnits
          const currencyIds = this.currencyPriceForMap.map(value => {
            return +Object.keys(value)[0];
          });
          this.units = res[1] && res[1].length ? res[1] : this._unitsService.units;
          this._setCurrencies(currencyIds);
          this._setPriceForUnits();
        }));
  }

  private _getPageNumbers(pageEvent: PageEvent): number[] {
    const numOfPages = Math.ceil(pageEvent.length / pageEvent.pageSize);
    const pageNumbers = [];

    for (let i = 0; i < numOfPages; i++) {
      pageNumbers.push(i + 1);
    }

    return pageNumbers.filter(value => {
      const pageIndex = pageEvent.pageIndex + 1;
      if (pageIndex > 3 && (pageNumbers.length - pageIndex) >= 2) {
        return Math.abs(value - pageIndex) <= 2;
      }
      if (pageIndex <= 3) {
        return value <= 5;
      }
      if (pageIndex > 3 && (pageNumbers.length - pageIndex) < 2) {
        return value >= pageIndex - 2 - (2 - (pageNumbers.length - pageIndex));
      }
    });
  }

  private _setPriceForUnits(): void {
    const priceForIdParam = +this._route.snapshot.queryParamMap.get('priceFor');
    if (priceForIdParam) {
      const priceForFromParam = this.priceForUnits && this.priceForUnits.find(value => +value.id === priceForIdParam);
      if (priceForFromParam) {
        this.searchKeyPrice.priceForUnit = priceForFromParam;
      } else {
        this.searchKeyPrice.priceForUnit = this.priceForUnits && this.priceForUnits[0];
      }
    } else {
      this.searchKeyPrice.priceForUnit = this.priceForUnits && this.priceForUnits[0];
    }
  }

  /**
   * Получает объекты валют и устанавливает текущую валюту в порядке: валюта корзины - валюта из queryParams('cur') - первая валюта из
   * get-currency-and-price-per-unit
   * Также блокирует чекбоксы выбора товаров, если у товара нет валюты, как у товаров в корзине
   */
  private _setCurrencies(currencyIds: number[]): void {
    if (Array.isArray(currencyIds) && currencyIds.length) {
      this.disabledCheckboxesTooltip = '';    // обнуляем
      this.disableCheckboxes = false;
      this.currencies = this._unitsService.getUnitsByIds(currencyIds);
      const curIdParam = +this._route.snapshot.queryParamMap.get('cur');
      if (curIdParam) {     // если передается парам
        const paramCurrencyObj = this.currencies.find(value => +value.id === curIdParam);
        if (paramCurrencyObj) {
          this.searchKeyPrice.currency = this.currencies && paramCurrencyObj;
        } else {
          this.searchKeyPrice.currency = this.currencies && this.currencies[0];
        }
        // то если валюты не совпадают - блокируем чекбоксы
        if (this.currentCartCurrency && +this.searchKeyPrice.currency.id !== +this.currentCartCurrency.id) {
          this.disabledCheckboxesTooltip = this._translate.instant('filters.productWithTheCurrencyCantBeCarted');
          this.disableCheckboxes = true;
        }
      } else if (this.currentCartCurrency) {      // если не передается парам, то пытаемся менять валюту на корзинную
        const sameCurrencyAsOrders = this.currencies.find(value => +value.id === +this.currentCartCurrency.id);
        if (sameCurrencyAsOrders) {
          this.searchKeyPrice.currency = sameCurrencyAsOrders;
        } else {          // если нет корзинной валюты у товара, то блокируем чекбоксы
          this.disabledCheckboxesTooltip = this._translate.instant('filters.productWithTheCurrencyCantBeCarted');
          this.disableCheckboxes = true;
          this.searchKeyPrice.currency = this.currencies && this.currencies[0];
        }
      } else {
        this.searchKeyPrice.currency = this.currencies && this.currencies[0];
      }
    }
  }

  private _clearList(): void {
    this.category = null;
    this.mainProperties = [];
    this.properties = [];
    this.products = [];
    this.manufacturers = [];
    this.pageEvent.pageIndex = 1;     // обнуляем страницу
    this.searchKeyProductManufacturer = null;
    this.modelName = null;
    this.searchKeyName = '';
    this.searchKeyProperties = {};
    this.manufacturersLoaded.emit(this.manufacturers);
    this.loadedProducts.emit(this.products);
  }

  private _getPropsFromParams(): void {
    const paramMap = this._route.snapshot.queryParamMap;

    paramMap.keys.forEach(key => {
      let index;

      const mainPropertiesSearch = this.mainProperties.find((value, i) => {
        if (seoUrlStringReplacer(value.nameEn.toLowerCase()) === key) {
          index = i;
        }

        return seoUrlStringReplacer(value.nameEn.toLowerCase()) === key;
      });

      const propertiesSearch = this.properties.find((value, i) => {
        if (seoUrlStringReplacer(value.nameEn.toLowerCase()) === key) {
          index = i;
        }

        return seoUrlStringReplacer(value.nameEn.toLowerCase()) === key;
      });

      const property = mainPropertiesSearch || propertiesSearch;

      if (property) {       // характеристики категорий
        this.searchKeyProperties[+property.id] = paramMap.get(key);
      }

      this.pageEvent.pageIndex = 1;

      switch (key) {
        case this.QUERY_PARAMS.NAME:
          this.searchKeyName = paramMap.get(key);
          break;
        case this.QUERY_PARAMS.CITY:
          this.searchKeyCity = +paramMap.get(key);
          break;
        case this.QUERY_PARAMS.PRICEFROM:
          this.searchKeyPrice.from = paramMap.get(key);
          break;
        case this.QUERY_PARAMS.PRICETO:
          this.searchKeyPrice.to = paramMap.get(key);
          break;
        case this.QUERY_PARAMS.MANUFACTURER:
          this.searchKeyProductManufacturer = paramMap.get(key);
          break;
        case this.QUERY_PARAMS.MODEL:
          this.modelName = paramMap.get(key);
          break;
        case this.QUERY_PARAMS.PAGE:
          this.pageEvent.pageIndex = +paramMap.get(key);
          break;
        case 'sortedBy':
          this.sortedBy = {field: paramMap.get(key), dir: paramMap.get('sortDir') === 'ASC'};
          break;
      }
    });
  }

  /**
   * Получаем значения для автокомплита характеристик
   */
  private _getPropertyItems(): Observable<any> {
    const sendPropFilter = [];
    if (this.mainProperties) {
      this.mainProperties.forEach(value => {
        const searchPropValue = this.searchKeyProperties[value.id];

        if (searchPropValue) {    // если указано значение в форме то запихиваем в запрос
          sendPropFilter.push({
            property: value.id,
            value: searchPropValue
          });
        }
      });
    }

    if (this.properties) {
      this.properties.forEach(value => {
        const searchPropValue = this.searchKeyProperties[value.id];

        if (searchPropValue) {    // если указано значение в форме то запихиваем в запрос
          sendPropFilter.push({
            property: value.id,
            value: searchPropValue
          });
        }
      });
    }

    const params: any = {
      category: this.category && this.category.categoryId,
      categoryProperties: [...this.mainProperties.map(value => +value.id), ...this.properties.map(value => +value.id)],
      priceFrom: +this.searchKeyPrice.from,
      priceTo: +this.searchKeyPrice.to,
      name: this.searchKeyName,
      pricePerUnit: this.priceForUnitId,
      manufacturer: this.searchKeyProductManufacturer,
      model: this.modelName,
      lang: this.config.locale,
      status: 4,
      properties: JSON.stringify(sendPropFilter),
      individual: 1,
      currencyPerUnit: this.currencyId,
      group: 'supplier'
    };

    return this._productService.getProductPropertyValues(params)
      .pipe(
        map((res: any[]) => {
          // автокомплиты
          this.models = res.find(value => value.filterName === 'model').values;
          this.manufacturers = res.find(value => value.filterName === 'manufacturer').values;
          this.manufacturersLoaded.emit(this.manufacturers);
          this.properties.forEach(value => {
            const items = res.find(value1 => +value1.filterName === +value.id);
            value['items'] = items.values || [];
          });
          this.mainProperties.forEach(value => {
            const items = res.find(value1 => +value1.filterName === +value.id);
            value['items'] = items.values || [];
          });
        }), catchError(() => of(null))
      );
  }
}
