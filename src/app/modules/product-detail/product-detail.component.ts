import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxGalleryAnimation, NgxGalleryImage, NgxGalleryOptions } from 'ngx-gallery';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ConfigService, ProductService, SeoService } from '@b2b/services';
import { MatDialog } from '@angular/material';
import { CategoryPropertySpecialFields, PaymentOptions } from '@b2b/constants';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import { uniqBy, uniq } from 'lodash';
import { Location } from '@angular/common';
import { DecodeData } from '@b2b/models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  galleryOptions: NgxGalleryOptions[] = [];
  galleryImages: NgxGalleryImage[] = [];

  zoom = 8;
  lat = 0;
  lng = 0;
  mapClusterSuppliers = [];
  product: any;
  currency: any;
  priceFor: any;
  weight: any;
  volume: any;
  isAddedToOrder = false;
  differentCurrencies = true;
  currentCart: Map<any, any>;
  form: FormGroup;
  similarProducts = [];
  seoH1 = '';
  seoTxt: SafeHtml = '';

  private _productId: number;
  private _prodSub: Subscription;
  private _routeSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _route: ActivatedRoute,
    private _productService: ProductService,
    private _seo: SeoService,
    private _matDialog: MatDialog,
    private _router: Router,
    private _location: Location,
    private _formBuilder: FormBuilder,
    private _sanitizer: DomSanitizer,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this._productId = +this._route.snapshot.params.productId;
    this.setupData();
    this.form = this._getForm();

    this._routeSub = this._router.events
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((evt) => {
        if (evt instanceof NavigationEnd) {
          this._productId = +this._route.snapshot.params.productId;
          this.setupData();
        }
      });
  }

  private _getForm(): FormGroup {
    return this._formBuilder.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      buyerPrice: [{
        value: null,
        disabled: (this.product && +this.product.paymentOption) === PaymentOptions.BARGAIN_IS_NOT_POSSIBLE
      }, Validators.min(0.01)],
      buyerTotal: null,
      sellerTotal: null,
    });
  }

  handleClickBack() {
    this._location.back();
  }

  private setupData(): void {
    this._prodSub = this._productService.getCheckedProducts(this._productId)
      .pipe(
        mergeMap((prodValue: any) => {
          this.product = prodValue;
          this.product.price = Math.round(+this.product.price);
          this.currency = this.product.showcase && this.product.showcase.showcaseUnits && this.product.showcase.showcaseUnits.currency;
          this.priceFor = this.product.showcase && this.product.showcase.showcaseUnits && this.product.showcase.showcaseUnits.priceFor;
          this.weight = this.product.showcase && this.product.showcase.showcaseUnits && this.product.showcase.showcaseUnits.weight;
          this.volume = this.product.showcase && this.product.showcase.showcaseUnits && this.product.showcase.showcaseUnits.volume;

          // дефолтная сео дата
          this._seo.setTitleWTranslate('filters.productInfoTitleSuffix', this.product[this.config.name]);
          this._seo.setDescriptionWTranslate('filters.productInfoDescSuffix', this.product[this.config.name]);
          if (this.product.attributes && this.product.attributes.canonical) {
            this._seo.createCanonicalLink(this.product.attributes && this.product.attributes.canonical);
          }

          this.product.priceFormula = this.product._embedded.priceFormula;
          this.currentCart = this._productService.cartedProducts;
          this.updateInfoFromCart();
          // получаем countUnit - м2 в штуке
          const valuePropertyName = 'valueEn';
          if (this.product.productProperties) {
            const propertyWithFormula = this.product.productProperties.find((prop) => {
              return prop.special === CategoryPropertySpecialFields.WITH_FORMULS && !!prop[valuePropertyName];
            });

            if (propertyWithFormula) {
              this.product.countUnitProperty = propertyWithFormula.categoryProperty;
              this.product.countUnit = +propertyWithFormula[valuePropertyName];
            }
          }

          if (prodValue.photos && prodValue.photos.length) {
            this.galleryImages = [];
            prodValue.photos.forEach(photo => {
              this.galleryImages.push({
                small: `${this.config.serverUrl}/${photo.link}`,
                medium: `${this.config.serverUrl}/${photo.link}`,
                big: `${this.config.serverUrl}/${photo.link}`,
              });
            });
          }
          return forkJoin(
            this._productService.getProductMapListSuppliers(prodValue.hash, prodValue.showcase.showcaseUnits.currency.id),
            this._productService.getProductPrices(this.product.hash, this.currency.id),
            this._productService.withThisProductBuy(this.product.id),
            this.seoUpdate()
          );
        })
      )
      .subscribe(([mapSuppliers, prodPrices, withThisProductBuy]) => {
        const clusters = [], arrLat = [], arrLng = [];
        this.product.productPrices = prodPrices;
        this.similarProducts = withThisProductBuy;
        mapSuppliers['suppliers'].forEach(sup => {
          if (sup.location.lat && sup.location.lng) {
            arrLat.push(sup.location.lat);
            arrLng.push(sup.location.lng);
            const x = clusters.find(cl => cl.lat === parseFloat(sup.location.lat));
            const y = clusters.find(cl => cl.lng === parseFloat(sup.location.lng));
            if (x && y) {
              x.suppliers.push(sup);
            } else {
              clusters.push({
                suppliers: [sup],
                lat: parseFloat(sup.location.lat),
                lng: parseFloat(sup.location.lng)
              });
            }
          }
        });
        this.mapClusterSuppliers = clusters;
        this.lat = this.median(arrLat);
        this.lng = this.median(arrLng);
      }, (err: HttpErrorResponse) => {
        if (err && (err.status === 404 || isNaN(+this._productId))) {
          this._router.navigate(['not-found']);
        }
      });

    this.setupGallery();
  }

  seoUpdate(): Observable<any> {
    const seoPropsString = JSON.stringify(this.createSeoPropsArray());
    const searchKeyProps = this.createSeoPropsArray().reduce(
      (obj, item) => Object.assign(obj, {[Object.keys(item)[0]]: item[Object.keys(item)[0]]}), {});
    const category = this.product.showcase.categoryData;
    return this._seo.findSeoMetaData(category.id, 5, seoPropsString)
      .pipe(
        map(value => {
          const decodeData: DecodeData = {
            categoryName: category[this.config.name],
            countryName: this.product.countryData && this.product.countryData[this.config.name],
            h1: '',
            manufacturerName: this.product.productManufacturerData && this.product.productManufacturerData[this.config.name],
            productName: this.product[this.config.name],
            properties: this.product.productProperties.map(prop => prop.categoryProperty),
            searchKeyProperties: searchKeyProps,
            title: value[`titleName${this.config.locale}`]
          };
          this.seoH1 = this._seo.decodeMeta(value[`headerName${this.config.locale}`], decodeData);
          decodeData['h1'] = this.seoH1;
          this._seo.setTagsFromSeoDataForCategoryObject(value, decodeData);
          if (value[`descriptionName${this.config.locale}`]) {
            this.seoTxt = this._sanitizer.bypassSecurityTrustHtml(this._seo.decodeMeta(value[`descriptionName${this.config.locale}`],
              decodeData));
          }
        }), catchError(() => of(null)));
  }

  createSeoPropsArray(): any[] {
    const res = [];
    if (this.product.countryData) {
      res.push({country: this.product.countryData[this.config.name]});
    }
    if (this.product.productManufacturerData) {
      res.push({manufacturer: this.product.productManufacturerData[this.config.name]});
    }
    this.product.productProperties.forEach(value => {
      if (value.categoryProperty.enabled && value['value' + this.config.locale]) {
        const obj = {};
        obj[`${value.categoryProperty.id}`] = value['value' + this.config.locale];
        res.push(obj);
      }
    });
    return res;
  }

  private setupGallery(): void {
    this.galleryOptions = [
      {
        width: '100%',
        height: '590px',
        imageSwipe: true,
        thumbnailsSwipe: true,
        imageAnimation: NgxGalleryAnimation.Slide,
        imagePercent: 74.58,
        thumbnailsPercent: 24.42,
        thumbnailsMargin: 64,
        thumbnailMargin: 10,
        previewCloseOnClick: true,
        previewCloseOnEsc: true,
        thumbnailsColumns: 7,
        arrowPrevIcon: 'fa fa-angle-left',
        arrowNextIcon: 'fa fa-angle-right'
      },
      {
        breakpoint: 1199,
        width: '100%',
        height: '590px',
        imagePercent: 74.58,
        thumbnailsPercent: 24.42,
        thumbnailsMargin: 64,
        thumbnailMargin: 10,
        thumbnailsColumns: 6
      },
      {
        breakpoint: 768,
        width: '100%',
        height: '590px',
        imagePercent: 74.58,
        thumbnailsPercent: 24.42,
        thumbnailsMargin: 64,
        thumbnailMargin: 10,
        thumbnailsColumns: 7
      },
      {
        breakpoint: 600,
        width: '100%',
        height: '520px',
        imagePercent: 74.58,
        thumbnailsPercent: 24.42,
        thumbnailsMargin: 44,
        thumbnailMargin: 10,
        thumbnailsColumns: 6
      },
      {
        breakpoint: 500,
        width: '100%',
        height: '400px',
        imagePercent: 75,
        thumbnailsPercent: 25,
        thumbnailsMargin: 20,
        thumbnailMargin: 10,
        thumbnailsColumns: 5
      },
      {
        breakpoint: 418,
        width: '100%',
        height: '400px',
        imagePercent: 75,
        thumbnailsPercent: 25,
        thumbnailsMargin: 20,
        thumbnailMargin: 10,
        thumbnailsColumns: 4
      },
      {
        breakpoint: 360,
        width: '100%',
        height: '340px',
        imagePercent: 71.15,
        thumbnailsPercent: 28.85,
        thumbnailsMargin: 18,
        thumbnailMargin: 10,
        thumbnailsColumns: 3
      }
    ];
  }

  makeOrder(): void {
    this._productService.clearCart();
    this._productService.isBuyNow.next(true);
    const product: any = {
      ...this.product,
      currency: this.currency,
      priceFor: this.priceFor,
      manufacturer: this.product.productManufacturerData,
      category: this.product.showcase.categoryData,
      count: 1
    };

    if (product.productPrices && product.productPrices.length > 0) {
      const len = (<any[]>product.productPrices).length;
      product.price = product.productPrices[Math.floor((len - 1) / 2)].price;
    }

    product.paymentOption = PaymentOptions.BARGAIN_IS_POSSIBLE;
    this._productService.cartedProducts.set(`${product.showcase.category}`, [product]);
    this._router.navigate(['make-individual-order']);
  }

  addToCart() {
    const prods = this.currentCart.get(+this.product.showcase.category);
    let newProds = [];
    if (prods) {
      newProds = uniqBy([...prods, this.getMeOut(this.product)], 'id');
    } else {
      newProds = [this.getMeOut(this.product)];
    }
    this.isAddedToOrder = true;
    this.currentCart.set(+this.product.showcase.category, newProds);
    this.setupData();
  }

  getMeOut(p) {
    return {
      id: p.id,
      category: p.showcase.categoryData,
      currency: p.showcase.showcaseUnits.currency,
      gross: p.gross,
      photos: p.photos && p.photos[0] && p.photos[0].link,
      nameRu: p.nameRu,
      nameCn: p.nameCn,
      nameEn: p.nameEn,
      manufacturer: {
        nameRu: p.productManufacturerData.nameRu,
        nameCn: p.productManufacturerData.nameCn,
        nameEn: p.productManufacturerData.nameEn,
      },
      minimalAmount: p.minimal_amount,
      net: p.net,
      count: 1,
      paymentOptionId: p.paymentOption,
      price: Number(p.price),
      priceFor: p.showcase.showcaseUnits.priceFor,
      priceForOne: p.countUnit,
      properties: p.productProperties.map(value => {
        return {...value.categoryProperty, ...value};
      }),
      countryNameRu: p.countryData.nameRu,
      countryNameCn: p.countryData.nameCn,
      countryNameEn: p.countryData.nameEn,
      country: p.countryData,
      volume: p.volume
    };
  }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`);
  }

  private median(arr: number[]): number {
    if (arr && arr.length) {
      let summ = 0;
      let count = 0;
      arr.forEach(el => {
        if (el) {
          summ += +el;
          count++;
        }
      });
      return summ / count;
    }
    return 0;
  }

  updateInfoFromCart() {
    const ids = [];
    const currencies = [];
    this.currentCart.forEach((cat: any[]) => {
      if (cat && cat.length) {
        cat.forEach(prod => {
          ids.push(+prod.id);
          currencies.push((prod.currency && +prod.currency.id) || +prod.showcase.showcaseUnits.currency.id);
        });
      }
    });
    this.isAddedToOrder = ids.includes(+this._productId);
    this.differentCurrencies = uniq(currencies).length > 1;
    if (uniq(currencies).length > 1) {
      // такого в принципе не должно быть, но всякое бывает
      this.differentCurrencies = true;
    } else if (uniq(currencies).length === 1) {
      this.differentCurrencies = uniq(currencies)[0] !== this.product.showcase.showcaseUnits.currency.id;
    }
  }

}
