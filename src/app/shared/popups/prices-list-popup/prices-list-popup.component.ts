import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigService } from '@b2b/services';

@Component({
  selector: 'app-prices-list',
  templateUrl: './prices-list-popup.component.html',
  styleUrls: ['./prices-list-popup.component.scss']
})
export class PricesListPopupComponent {

  @Input() item;
  @Output() priceClicked = new EventEmitter();

  constructor(public config: ConfigService) {
  }

  onPriceClick(item, price) {
    item.price = price;
    this.priceClicked.emit();
  }

  close() {
    this.priceClicked.emit();
  }
}
