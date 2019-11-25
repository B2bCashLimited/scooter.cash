import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { CategoriesService, ConfigService, ProductService } from '@b2b/services';
import { MarketplaceCategory } from '@b2b/models';
import { delay, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@b2b/environments/environment';
import { getFromLocalStorage } from '@b2b/helpers/utils';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-select-category',
  templateUrl: './select-category.component.html',
  styleUrls: ['./select-category.component.scss']
})
export class SelectCategoryComponent implements OnInit, OnDestroy {

  @Output() categoryChange = new EventEmitter<MarketplaceCategory>();

  parentCategory: MarketplaceCategory;
  categories: MarketplaceCategory[] = [];
  selectedCategoryId: string;
  hostName = environment.production ? location.hostname : 'scooter.cash';
  queryParamsUtm = isPlatformBrowser(this.platformId) && getFromLocalStorage('UTM');

  private _selectedCategory: MarketplaceCategory;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    public config: ConfigService,
    private _categoriesService: CategoriesService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _productService: ProductService,
  ) {
  }

  get selectedCategory(): MarketplaceCategory {
    return this._selectedCategory;
  }

  @Input() set selectedCategory(value: MarketplaceCategory) {
    if (this._selectedCategory !== value) {
      this._selectedCategory = value;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    const parentCategoryId = this._route.snapshot.params.parentCategoryId;

    if (parentCategoryId) {
      this._getCategoryById(+parentCategoryId)
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(() => {}, (err: HttpErrorResponse) => {
          if (err && (err.status === 404 || isNaN(+parentCategoryId))) {
            this._router.navigate(['not-found']);
          }
        });
    } else {
      this._getMarketplaceCategories()
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(() => {}, (err: HttpErrorResponse) => {
          if (err && (err.status === 404 || (this.parentCategory && isNaN(+this.parentCategory.id)))) {
            this._router.navigate(['not-found']);
          }
        });
    }

    this._route.params
      .pipe(
        filter((res: any) => res.categoryId),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(res => {
        if (res.categoryId === 'all') {
          this.selectedCategoryId = '-1';
        } else {
          this.selectedCategoryId = res.categoryId;
        }
      });
  }

  onCategoryChanged(categoryId: number): void {
    const category = this.categories.find(value => +value.categoryId === +categoryId);
    this.categoryChange.emit(category);
    this._productService.isSearchForAllCategories$.next(false);
  }

  private _getMarketplaceCategories(): Observable<any> {
    return this._categoriesService.marketplaceCategory$
      .pipe(
        tap(() => this.categories = []),
        switchMap((res: MarketplaceCategory) => {
          if (res) {
            this.parentCategory = res;
            return this._getCategoryById(+res.categoryId);
          }

          return of(null);
        })
      );
  }

  private _getCategoryById(parentCategoryId: number): Observable<any> {
    const data: any = {
      marketplace: this.hostName,
      category: parentCategoryId,
      card: 1
    };

    return this._categoriesService.getMarketplaceChildCategories(data)
      .pipe(
        tap((categories: MarketplaceCategory[]) => this.categories = categories),
        delay(100),
        map((categories: MarketplaceCategory[]) => {
          let queryParams: any;

          if (this.queryParamsUtm) {
            queryParams = {...JSON.parse(this.queryParamsUtm)};
          }

          if (categories && categories.length > 0) {
            const categoryId = this._route.snapshot.params.categoryId;

            if (!categoryId || categoryId === 'all') {
              this.selectedCategoryId = '-1';
              this._router.navigate([`/catalog/${parentCategoryId}/all`], {
                queryParams,
                relativeTo: this._route,
                queryParamsHandling: 'merge'
              });
            } else {
              const category = categories.find(value => +value.categoryId === +categoryId);

              if (category) {
                this.selectedCategoryId = category.categoryId || null;
              } else {
                this.selectedCategoryId = null;
                  this._router.navigate(['not-found']);
              }
            }
          } else {
            this.selectedCategoryId = '-1';
            this._router.navigate([`/catalog/${parentCategoryId}/all`], {
              queryParams,
              relativeTo: this._route,
              queryParamsHandling: 'merge'
            });
          }
        })
      );
  }
}
