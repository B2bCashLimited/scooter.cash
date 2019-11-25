import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryProperty, MarketplaceCategory } from '@b2b/models';

class Category {
  id: number;
  nameCn: string;
  nameEn: string;
  nameRu: string;
  name?: string;
  children?: Category[];
  hasChildren?: boolean;
  iconClass?: string;
  iconClassColor?: string;
  iconImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  marketplaceCategory$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private _http: HttpClient,
    private _config: ConfigService,
  ) {
  }

  getCategoryByName(name: string): Observable<any> {
    const obj: any = {
      'filter[0][type]': 'eq',
      'filter[0][field]': 'nameRu',
      'filter[0][value]': `${name}`
    };
    const params = new HttpParams({fromObject: obj});

    return this._http.get(`${this._config.apiUrl}/categories`, {params})
      .pipe(
        map((res: any) => this.normalizeCategories(res._embedded.category))
      );
  }

  getCategoryById(id: string): Observable<any> {
    const obj: any = {
      'filter[1][type]': 'eq',
      'filter[1][field]': 'id',
      'filter[1][value]': `${id}`
    };
    const params = new HttpParams({fromObject: obj});

    return this._http.get(`${this._config.apiUrl}/categories`, {params})
      .pipe(
        map((res: any) => this.normalizeCategories(res._embedded.category))
      );
  }

  getCategoryProperties(categoryId): Observable<any> {
    const obj: any = {
      'filter[0][type]': 'innerjoin',
      'filter[0][field]': 'category',
      'filter[0][alias]': 'c',
      'filter[1][type]': 'eq',
      'filter[1][field]': 'id',
      'filter[1][alias]': 'c',
      'filter[1][value]': `${categoryId}`,
      'filter[1][where]': 'and',
      'order-by[3][type]': 'field',
      'order-by[3][field]': 'priority',
      'order-by[3][direction]': 'asc',
      'filter[4][type]': 'eq',
      'filter[4][field]': 'enabled',
      'filter[4][value]': '1',
      'filter[4][where]': 'and',
      'filter[5][type]': 'eq',
      'filter[5][field]': 'useArea',
      'filter[5][value]': '1',
      'filter[6][type]': 'eq',
      'filter[6][field]': 'isDeleted',
      'filter[6][value]': '0',
      'perPage': '100'
    };
    const params = new HttpParams({fromObject: obj});

    return this._http.get(`${this._config.apiUrl}/category-properties`, {params})
      .pipe(
        map((res: any) => {
          const properties = res._embedded.category_property;
          // save id as categoryProperty to use on showcases products
          properties.forEach((prop: CategoryProperty) => prop.categoryProperty = prop.id);
          return properties;
        }));
  }

  /**
   * Retrieves categories by id
   */
  getCategoryByIdAndNormalizeChildren(id: number): Observable<any> {
    return this._http.get(`${this._config.apiUrl}/categories/${id}`)
      .pipe(
        map((res: any) => res._embedded.categories.map((cat) => this.normalizeCategoriesChildren(cat)))
      );
  }

  getCategoriesTreeForParent(categoryId: number): Observable<any> {
    const obj: any = {category: categoryId};
    const params = new HttpParams({fromObject: obj});
    return this._http.get(`${this._config.apiUrl}/categories-tree-for-parent`, {params})
      .pipe(
        map((res: any) => res._embedded.categories)
      );
  }

  /**
   * LightWeight categories/id - w/o _embedded
   */
  getCategorySearchById(id: number): Observable<any> {
    const params = {
      in: `${id}`
    };
    return this._http.get(`${this._config.apiUrl}/category-search`, {params})
      .pipe(map(value => value['_embedded'].categories[0]));
  }

  getCategoriesWithProductsIds(parentId: number): Observable<any> {
    return this._http.get(`${this._config.apiUrl}/get-manufacturer-category?category=${parentId}`);
  }

  getMarketplaceCategories(marketplace: string) {
    const params = new HttpParams({fromObject: {marketplace, withProducts: '1'}});

    return this._http.get(`${this._config.apiUrl}/list-marketplace-categories`, {params})
      .pipe(
        map((res: MarketplaceCategory[]) => {
          res.forEach(category => {
            category['childs'] = (category['childs'] || []).filter(value => !!value.countProducts);
          });

          return res;
        })
      );
  }

  getMarketplaceChildCategories(data: any): Observable<MarketplaceCategory[]> {
    const params = new HttpParams({fromObject: data});
    return this._http.get(`${this._config.apiUrl}/list-marketplace-child-categories`, {params})
      .pipe(map((res: MarketplaceCategory[]) => res.filter((item) => item.countProducts)));
  }

  getBrandsForAllCategories(obj: any): Observable<{value: string, count: number}[]> {
    const params = new HttpParams({fromObject: obj});
    return this._http.get(`${this._config.apiUrl}/list-brands`, {params})
      .pipe(
        map((res: {value: string, count: number}[]) => res)
      );
  }

  /**
   * Apply localized name of categories
   */
  private normalizeCategories(categories) {
    return categories.map((category: any) => {
      category.id = +category.id;
      category.name = category['name' + this._config.locale];
      category.children = null;
      const childCategories = category._embedded.categories;
      category.hasChildren = childCategories.length;

      return category;
    });
  }

  private normalizeCategoriesChildren(category) {
    const result = new Category();

    result.id = category.id;
    result.nameCn = category.nameCn;
    result.nameEn = category.nameEn;
    result.nameRu = category.nameRu;
    result.name = category['name' + this._config.locale];
    result.children = null;
    result.iconClass = category.iconClass;
    result.iconClassColor = category.iconClassColor;
    result.iconImage = category.iconImage;
    result.hasChildren = category.children && category.children.length;
    if (result.hasChildren) {
      result.children = category.children.map((child) => this.normalizeCategoriesChildren(child));
    }

    return result;
  }
}
