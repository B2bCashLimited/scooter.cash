import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-deal',
  templateUrl: './deal.component.html',
  styleUrls: ['./deal.component.scss']
})
export class DealComponent implements OnInit {

  urlCheckLang: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.urlCheckLang = this._route.snapshot.params['lang'];
  }

}
