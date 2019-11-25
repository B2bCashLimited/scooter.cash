export class Pager {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;

  constructor(obj) {
    this.currentPage = obj.page;
    this.perPage = obj.page_size;
    this.totalItems = obj.total_items;
    this.totalPages = obj.page_count;
  }
}
