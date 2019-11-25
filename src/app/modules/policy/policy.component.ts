import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {

  urlCheckLang: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.urlCheckLang = this._route.snapshot.params['lang'];
  }

}
