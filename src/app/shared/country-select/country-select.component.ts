import {
  Component, OnInit, Input, Output, EventEmitter, forwardRef, OnDestroy, AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import { FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { Geolocation, Country } from '@b2b/models';
import { MatAutocompleteTrigger } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { ConfigService, LocationService } from '@b2b/services';

@Component({
  selector: 'app-country-select',
  templateUrl: './country-select.component.html',
  styleUrls: ['./country-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySelectComponent),
      multi: true
    }
  ]
})
export class CountrySelectComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor {
  @ViewChild(MatAutocompleteTrigger) trigger;
  @ViewChild('countryInput') countryInput: ElementRef;

  locationsCtrl: FormControl;
  filteredLocations: Observable<any[]>;
  _placeholder: string;
  onChange;
  found: any = [];
  selected: any = null;
  lastApplied: Geolocation;
  locations: Geolocation[] | any = [];
  currentLang = this._config.locale;

  private _limit: number;
  private _disabled: boolean;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  @Input() validator: boolean;

  @Input()
  set placeholder(val: string) {
    this._placeholder = val;
  }

  @Input()
  set limit(val: number) {
    this._limit = val;
  }

  @Output() selectLocation = new EventEmitter();

  constructor(
    private _translateService: TranslateService,
    private _config: ConfigService,
    private _locationService: LocationService,
  ) {
    this._translateService.onLangChange
      .subscribe(() => {
        if (this.selected) {
          this.changeLanguage(this._config.locale);
        }
        this.statusUpdate();
      });
  }

  ngAfterViewInit(): void {
    this.trigger.panelClosingActions
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(() => this.onPanelClose());
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.locationsCtrl = new FormControl('');

    this._locationService.getCountries()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((locations: Country[]) => {
        this.locations = locations;
        this.inputUpdate();
      });

    this.statusUpdate();
    this.filterInit();

    this.filteredLocations
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(locations => this.found = locations);
  }

  writeValue(val): void {
    this.setValue(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
  }

  setDisabledState(value: boolean): void {
    if (value) {
      this.locationsCtrl.disable();
    } else {
      this.locationsCtrl.enable();
    }
  }

  inputUpdate(): void {
    this.locationsCtrl.setValue(this.locationsCtrl.value);
  }

  setValue(value, isReset?: boolean): void {
    if (this.locationsCtrl && value) {
      this.selected = value;
      this.apply(value);
    } else if (isReset) {
      this.locationsCtrl.setValue('');
    }
  }

  changeLanguage(language: string): void {
    const newVal: string = this.selected[ 'name' + language ];
    if (newVal) {
      this.locationsCtrl.setValue(newVal);
    }
  }

  onPanelClose(): void {
    if (this.found.length === 0 || this.locationsCtrl.value === '') {
      this.apply({ name: null, id: null });
      this.locationsCtrl.setValue('');

    } else {
      this.apply(this.found[ 0 ]);
      this.selected = this.found[ 0 ];
    }
  }

  statusUpdate() {
    if (!this.locationsCtrl) {
      return;
    }

    if (this._disabled) {
      this.locationsCtrl.disable();
    } else {
      this.locationsCtrl.enable();
    }
  }

  filterInit() {
    const sliceLimit = this._limit ? this._limit : undefined;

    this.filteredLocations = this.locationsCtrl.valueChanges
      .pipe(
        startWith(null),
        map(location => {
          return location ? this.filterLocations(location).slice(0, sliceLimit) : this.locations.slice(0, sliceLimit);
        }));
  }

  filterLocations(name: string) {
    return this.locations.filter(location => {
      let resolve = false;

      if (location[ 'nameRu' ] && location[ 'nameRu' ].toLowerCase().indexOf(name.toLowerCase()) === 0) {
        resolve = true;
      }

      if (location[ 'nameEn' ] && location[ 'nameEn' ].toLowerCase().indexOf(name.toLowerCase()) === 0) {
        resolve = true;
      }

      if (location[ 'nameCn' ] && location[ 'nameCn' ].toLowerCase().indexOf(name.toLowerCase()) === 0) {
        resolve = true;
      }

      return resolve;
    });
  }

  close(): void {
    this.trigger.closePanel();
  }

  apply(location: Geolocation): void {
    this.locationsCtrl.setValue(location[ 'name' + this._config.locale ]);

    if (!this.lastApplied || this.lastApplied.id !== location.id) {
      location = location.id ? location : null;
      this.selectLocation.emit(location);
      this.lastApplied = location;

      if (this.onChange) {
        this.onChange(location);
      }
    }

    this.close();
  }

  onSelect(evt, location): void {
    if (evt.source.selected) {
      this.selected = location;
      this.setValue(location);
      this.apply(location);
    }
  }
}
