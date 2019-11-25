import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';
import { ConfigService } from './config.service';
import { DecodeData } from '@b2b/models';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  seoH1$ = new Subject<string>();
  seoTxt$ = new Subject<string>();
  title$ = new Subject<string>();
  description$ = new Subject<string>();
  keywords$ = new Subject<string>();

  linkEl: HTMLLinkElement;

  constructor(private _titleService: Title,
              private _metaService: Meta,
              private _translate: TranslateService,
              private _config: ConfigService,
              private _http: HttpClient,
              @Inject(DOCUMENT) private doc) {
  }


  setMainTitleAndDescription() {
    this.updateMainTitle();
    this.updateMainDescription();
    this.updateMainKeywords();
    if (this.linkEl) {
      this.doc.head.removeChild(this.linkEl);
      this.linkEl = null;
    }
  }

  updateMainDescription() {
    this.setDescriptionWTranslate('mainDesc');
  }

  updateMainTitle() {
    this.setTitleWTranslate('titles.mainTitle');
  }

  updateMainKeywords() {
    this._translate.get('mainKeywords').subscribe(value => this.keywords$.next(value));
  }

  setDescriptionWTranslate(translateKey: string, prefix = '') {
    this._translate.get(translateKey).subscribe(value => this.description$.next((prefix + value)));
  }

  setTitleWTranslate(translateKey: string, prefix = '', suffix = '') {
    this._translate.get(translateKey).subscribe(value => this.title$.next((prefix + value + suffix)));
  }

  setDescription(newDescription: string) {
    this._metaService.updateTag({name: 'description', content: newDescription});
  }

  setTitle(newTitle: string) {
    this._titleService.setTitle(newTitle);
  }

  setKeywords(newKeywords: string) {
    this._metaService.updateTag({name: 'keywords', content: newKeywords});
  }

  createCanonicalLink(canLink: string) {
    if (!this.linkEl) {
      this.linkEl = this.doc.createElement('link');
      this.linkEl.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(this.linkEl);
    }
    this.linkEl.setAttribute('href', canLink);
  }

  setTagsFromSeoDataForCategoryObject(seoData, decodeData: DecodeData) {
    if (seoData[`metaDescName${this._config.locale}`]) {
      this.description$.next(this.decodeMeta(seoData[`metaDescName${this._config.locale}`], decodeData));
      // this._metaService.updateTag({name: 'description', content: seoData[`metaDescName${this._config.locale}`]});
    }
    if (seoData[`titleName${this._config.locale}`]) {
      this.title$.next(this.decodeMeta(seoData[`titleName${this._config.locale}`], decodeData));
      // this._titleService.setTitle(seoData[`titleName${this._config.locale}`]);
    }
    if (seoData[`keywordsName${this._config.locale}`]) {
      this.keywords$.next(this.decodeMeta(seoData[`keywordsName${this._config.locale}`], decodeData));
      // this._metaService.updateTag({name: 'keywords', content: seoData[`keywordsName${this._config.locale}`]});
    }
  }

  getSeoDataForCategoryAndMarketPlace(categoryId: number, marketType: number) {
    const params = {
      'filter[0][type]': 'eq',
      'filter[0][field]': 'category',
      'filter[0][value]': `${categoryId}`,
      'filter[1][type]': 'eq',
      'filter[1][field]': 'type',
      'filter[1][value]': `${marketType}`,
      'order-by[0][type]': 'field',
      'order-by[0][field]': 'id',
      'order-by[0][direction]': 'asc'
    };
    return this._http.get(`${this._config.apiUrl}/seo-categories`, {params: params}).pipe(map(value => {
      return value['_embedded']['seo-category'][0];
    }));
  }

  findSeoMetaData(categoryId: number, type: number, props: string) {
    const params = {
      categoryId: `${categoryId}`,
      type: `${type}`,
      properties: props
    };
    return this._http.get(`${this._config.apiUrl}/find-seo-metadata`, {params: params});
  }

  decodeMeta(str: string, data: DecodeData): string {
    const testStr = str || '';
    let resStr = '';
    let foundPos1 = 0;
    let foundPos2 = 0;
    let strArray = [];
    let searchComplete = false;
    while (!searchComplete) {
      const indOfPr1 = testStr.indexOf('<pr>', foundPos1);
      foundPos1 = indOfPr1 + 1;
      if (indOfPr1 === -1) {
        strArray.push(testStr.slice(foundPos2 && (foundPos2 + 4)));
      } else {
        strArray.push(testStr.slice(foundPos2 && (foundPos2 + 4), indOfPr1));
      }
      const indOfPr2 = testStr.indexOf('</pr>', foundPos2);
      foundPos2 = indOfPr2 + 1;
      if (indOfPr1 === -1 && indOfPr2 === -1) {
        searchComplete = true;
      } else {
        strArray.push(testStr.slice(indOfPr1, indOfPr2 + 5));
      }
    }
    strArray = strArray.map((value: string) => {
      if (value.indexOf('<pr>') !== -1) {
        const tag = value.match(/#[a-z0-9]*#/);
        switch (tag && tag[0]) {
          case '#c#':
            return this.getReplacedString(value, '#c#', data.countryName);
          case '#city#':
            return this.getReplacedString(value, '#city#', data.cityName);
          case '#m#':
            return this.getReplacedString(value, '#m#', data.manufacturerName);
          case '#n#':
            return this.getReplacedString(value, '#n#', data.categoryName);
          case '#h1#':
            return this.getReplacedString(value, '#h1#', this.decodeMeta(data.h1, data));
          case '#title#':
            return this.getReplacedString(value, '#title#', this.decodeMeta(data.title, data));
          case '#prod#':
            return this.getReplacedString(value, '#prod#', data.productName);
          default:
            let propRes = '';
            data.properties.forEach(prop => {
              if (tag && tag[0] === `#p${prop.id}#`) {
                propRes = this.getReplacedString(value, `#p${prop.id}#`, data.searchKeyProperties && data.searchKeyProperties[prop.id]);
              }
            });
            return propRes;
        }
      } else {
        return value;
      }
    });
    resStr = strArray.join('').trim().replace(/\s+/g, ' ');
    return resStr;
  }

  getReplacedString(str: string, tag: string, data: string): string {
    if (data) {
      str = str.slice(4, str.indexOf('</pr>'));
      str = str.replace(tag, data);
    } else {
      str = '';
    }
    return str;
  }
}
