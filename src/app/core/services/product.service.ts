import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Pager } from '@b2b/models';
import { removeEmptyProperties } from '@b2b/helpers/utils';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  cartedProducts = new Map();   // categoryId: {}   корзина для товаров из наличия
  isBuyNow = new BehaviorSubject(false);
  isSearchForAllCategories$ = new BehaviorSubject<boolean>(false);
  selectedProducts$ = new BehaviorSubject<any[]>([]);

  constructor(
    private _http: HttpClient,
    private _config: ConfigService
  ) { }

  clearCart(): void {
    this.cartedProducts.clear();      // чистим корзину
  }

  searchProducts(filters: any): Observable<any> {
    const params = new HttpParams({ fromObject: removeEmptyProperties(filters) });
    return this._http.get(`${this._config.apiUrl}/product-search`, { params })
      .pipe(
        map(res => {
          const data = res['_embedded']['products'];

          data.forEach(prod => {
            prod.properties.map((prop) => {
              prop.categoryProperty = {
                id: +prop.categoryPropertyId,
                nameEn: prop.categoryPropertyNameEn,
                nameRu: prop.categoryPropertyNameRu,
                nameCn: prop.categoryPropertyNameCn,
              };
              return prop;
            });
          });

          return { pager: new Pager(res), data };
        }));
  }

  globalProductSearch(filters: any): Observable<any> {
    const params = new HttpParams({ fromObject: removeEmptyProperties(filters) });
    return this._http.get(`${this._config.apiUrl}/global-product-search`, { params })
      .pipe(
        map((res: any) => {
          const data = res._embedded.products;

          return { pager: new Pager(res), data };
        }));
  }

  getProductPropertyValues(params: {
    category: number, // (integer) ... identificator of category
    categoryProperties: number[],     // (integer) ... identificator of property
    // propertyValue: string,     // (string) ... value of property
    status: number,     // (integer) ... status
    pricePerUnit: number,     // (integer) ... identificator of pricePerUnit
    currencyPerUnit: number,     // (integer) ... identificator of currencyPerUnit
    excludeShowcase?: number,  // (integer) ... identificator of excludeShowcase
    showcase?: number,     // (integer) ... identificator of showcase
    individual: number,     // (integer) ... individual
    priceFrom: number,    // (float) ... price from
    priceTo: number,      // (float) ... price to
    name: string,       // (string) ... name of product
    manufacturer: string,     // (string) ... name of manufacturer
    country: string,      // (string) ... name of country
    lang: string,     // (string) ... language
    group?: string,      // (string) ... group
    properties: string   // {"property":"1","value":"1"}[]    // (array) ... array of properties
  }) {
    const paramsString = {
      category: `${params.category}`,
      // categoryProperties: `${params.categoryProperties}`,
      // propertyValue: `${params.propertyValue}`,
      status: `${params.status}`,
      pricePerUnit: `${params.pricePerUnit}`,
      currencyPerUnit: `${params.currencyPerUnit}`,
      excludeShowcase: `${params.excludeShowcase}` || null,
      showcase: `${params.showcase}` || null,
      individual: `${params.individual}`,
      priceFrom: `${params.priceFrom}` || null,
      priceTo: `${params.priceTo}` || null,
      name: `${params.name}` || null,
      manufacturer: `${params.manufacturer}` || null,
      country: `${params.country}` || null,
      lang: `${params.lang}`,
      group: `${params.group}`,
      properties: `${params.properties}` || null,
    };
    params.categoryProperties.forEach((value, i) => {
      paramsString[`categoryProperties[${i}]`] = value;
    });
    return this._http.get(`${this._config.apiUrl}/get-product-property-values`, { params: paramsString });
  }

  massDeleteProducts(ids): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/free-order-mass-delete`, ids);
  }

  confirmProposalFreeOrder(id): Observable<any> {
    const body: any = {
      proposalId: id
    };

    return this._http.post(`${this._config.apiUrl}/confirm-proposal-free-order`, body);
  }

  createFreeOrder(body) {
    return this._http.post(`${this._config.apiUrl}/create-free-order`, body);
  }

  getCheckedProducts(id): Observable<any> {
    return this._http.get(`${this._config.apiUrl}/products/${id}`);
  }

  getProductMapListSuppliers(hash: string, currency: string): Observable<any> {
    const params = new HttpParams({ fromObject: { hash, currency } });
    return this._http.get(`${this._config.apiUrl}/product-map-list-suppliers`, { params })
      .pipe(
        map(res => {
          return res;
        })
      );
  }

  getProductPrices(hash: string, currencyId: number) {
    const params = new HttpParams({
      fromObject: {
        hash,
        currency: `${currencyId}`
      }
    });

    return this._http.get(`${this._config.apiUrl}/product-prices`, { params })
      .pipe(map((res: any) => res.prices));
  }

  withThisProductBuy(productId: string): Observable<any> {
    const params = new HttpParams({ fromObject: { productId } });
    return this._http.get<any>(`${this._config.apiUrl}/with-this-product-buy`, { params })
      .pipe(
        map(res => res._embedded['with-this-product-buy'])
      );
  }

  getProductListSuppliers(hash: string, currency: string, country?: string): Observable<any> {
    const obj = { hash, currency, country };
    const params = new HttpParams({ fromObject: obj });
    return this._http.get(`${this._config.apiUrl}/product-list-suppliers`, { params });
  }

  getFreeOrderProposals(query: any): Observable<any> {
    const params = new HttpParams({ fromObject: removeEmptyProperties(query) });

    return this._http.get(`${this._config.apiUrl}/get-proposals-by-free-order`, { params })
      .pipe(
        map((res: any) => {
          const proposals = res._embedded['get-proposals-by-free-order']
            .map(item => {
              item.isCombined = !item.category && item.childFreeOrders && !!item.childFreeOrders.length;

              if (item.isCombined) {
                item.childFreeOrders = item.childFreeOrders.map(el => {
                  el.orderId = el.freeOrderId;
                  el.category = {
                    id: el.categoryId,
                    nameRu: el.categoryNameRu,
                    nameEn: el.categoryNameEn,
                    nameCn: el.categoryNameCn,
                  };

                  delete el.categoryId;
                  delete el.categoryNameRu;
                  delete el.categoryNameEn;
                  delete el.categoryNameCn;
                  return el;
                });
              }
              return item;
            });

          return { pager: new Pager(res), proposals };
        }));
  }
}
