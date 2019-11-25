import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  urlCheckLang: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.urlCheckLang = this._route.snapshot.params['lang'];
  }

}
