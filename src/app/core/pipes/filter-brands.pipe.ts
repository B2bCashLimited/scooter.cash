import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBrands'
})
export class FilterBrandsPipe implements PipeTransform {

  transform(value: {name: string, src: string}[], args: string[]): any {
    return value.filter(brand => {
      return args.find(brandName => brandName === brand.name);
    });
  }
}
