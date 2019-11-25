import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Activities } from '@b2b/constants';
import { ActivityName } from '@b2b/models';
import { Observable, Subject, Subscription } from 'rxjs';
import { ActivityNameService, ConfigService, UserService } from '@b2b/services';
import { getFromLocalStorage, removeFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';

const ACTIVITIES = [
  Activities.CUSTOMS_BROKERS,
  Activities.CUSTOMS_WITHOUT_LICENSES,
  Activities.DOMESTIC_AIR_CARRIERS,
  Activities.DOMESTIC_RAIL_CARRIERS,
  Activities.DOMESTIC_TRUCKERS,
  Activities.INTERNATIONAL_AIR_CARRIERS,
  Activities.INTERNATIONAL_RAIL_CARRIERS,
  Activities.INTERNATIONAL_TRUCKERS,
  Activities.MANUFACTURERS,
  Activities.RIVER_CARRIERS,
  Activities.SEA_CARRIERS,
  Activities.SUPPLIERS,
  Activities.WAREHOUSES,
  Activities.WAREHOUSES_RENTS,
];

const SHORT_NAME = {
  customsBroker: {label: 'activities.nameShort.customsBroker', icon: 'customs-license'},
  customsWithoutLicense: {label: 'activities.nameShort.customsWithoutLicense', icon: 'customs'},
  domesticAirCarrier: {label: 'activities.nameShort.domesticAirCarrier', icon: 'plane-country'},
  domesticRailCarrier: {label: 'activities.nameShort.domesticRailCarrier', icon: 'rails-country'},
  domesticTrucker: {label: 'activities.nameShort.domesticTrucker', icon: 'lorry-country'},
  internationalAirCarrier: {label: 'activities.nameShort.internationalAirCarrier', icon: 'plane-world'},
  internationalRailCarrier: {label: 'activities.nameShort.internationalRailCarrier', icon: 'rails-world'},
  internationalTrucker: {label: 'activities.nameShort.internationalTrucker', icon: 'lorry-world'},
  manufacturer: {label: 'activities.nameShort.manufacturer', icon: 'manufactory'},
  riverCarrier: {label: 'activities.nameShort.riverCarrier', icon: 'ship-river'},
  seaCarrier: {label: 'activities.nameShort.seaCarrier', icon: 'ship-sea'},
  supplier: {label: 'activities.nameShort.supplier', icon: 'provider'},
  warehouse: {label: 'activities.nameShort.warehouse', icon: 'warehouse-security'},
  warehouseRent: {label: 'activities.nameShort.warehouseRent', icon: 'warehouse-rent'},
};

@Component({
  selector: 'app-activity-select',
  templateUrl: './activity-select.component.html',
  styleUrls: ['./activity-select.component.scss']
})
export class ActivitySelectComponent implements OnDestroy, OnInit {

  @Input() onlyActivitiesWithIds = null;
  @Input() multiple = false;
  @Output() activityEditChange = new EventEmitter<void>();
  @Output() activityNameChange = new EventEmitter<any>();
  @Output() activityChange = new EventEmitter<any>();

  activeCompanyActivities: ActivityName[];
  activityNames: ActivityName[] = [];
  currentActivity: ActivityName;
  currentActivityName: ActivityName;
  userCompany = this._userService.userCompany$.value;

  private _activities: string[];
  private _activitiesSub: Subscription;
  private _result: any = {};
  private _selectAllActivities = false;
  private _selectAllActivityNames = false;
  private _ordersCount: any = {};
  private _paramSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private _activityNameService: ActivityNameService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _translateService: TranslateService,
    private _config: ConfigService,
    private _userService: UserService,
  ) {
  }

  @Input() set ordersCount(values: any) {
    this._ordersCount = values;
    this.updateCounters(values);
  }

  @Input() set activities(values: string[]) {
    if (this._activities !== values) {
      this._activities = values;
      if (!this._activities || !this._activities.length) {
        this._activities = ACTIVITIES;
      }
      if (isPlatformBrowser(this.platformId)) {
        const acts = getFromLocalStorage('B2B_ACTIVITIES');
        if (!isEqual(acts, this._activities)) {
          if (isPlatformBrowser(this.platformId)) {
            removeFromLocalStorage('B2B_ACTIVITY_SELECT');
            setToLocalStorage('B2B_ACTIVITIES', this._activities);
          }
        }
      }
      this.showCompanyActivities();
    }
  }

  get activities(): string[] {
    return this._activities || [];
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();

    if (this.multiple) {
      (this.activityNames || []).map((act) => act.selected = false);
      (this.activeCompanyActivities || []).map((act) => act.selected = false);
      if (isPlatformBrowser(this.platformId)) {
        removeFromLocalStorage('B2B_ACTIVITY_SELECT');
      }
    }
  }

  ngOnInit(): void {
    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => this.userCompany = res);
    }

    let obj;
    if (isPlatformBrowser(this.platformId)) {
      obj = getFromLocalStorage('B2B_ACTIVITY_SELECT');
    }
    if (!this.multiple && obj && Object.keys(obj).length) {
      this.currentActivity = obj.activity;
      this.currentActivity.selected = true;
      this.currentActivityName = obj.activityName;
      this.activityNameChange.emit(obj);
    }
    this._paramSub = this._route.queryParams
      .pipe(
        filter(params => params.hasOwnProperty('activity') && params.hasOwnProperty('activityName')),
        switchMap(params => {
          if (this._activitiesSub && !this._activitiesSub.closed) {
            this._activitiesSub.unsubscribe();
          }

          return this.getActivityNames()
            .pipe(map(() => params));
        })
      )
      .subscribe((params: any) => {
        const activity = this.activeCompanyActivities
          .find(act => +act.id === +params.activity);
        this.onActivityClick(activity);
        const activityName = this.activityNames
          .find(act => +act.id === +params.activityName);
        this.onActivityNameClick(activityName);
      });
  }

  onActivityClick(activity: ActivityName): void {
    if (!activity) {
      return;
    }
    if (!this.multiple) {
      this.activeCompanyActivities
        .filter(act => +act.id !== +activity.id)
        .forEach(act => act.selected = false);
    }
    activity.selected = !activity.selected;
    this.currentActivity = activity;
    this.normalizeActivities(activity);
  }

  onActivityNameClick(activity: ActivityName): void {
    if (!activity) {
      return;
    }
    activity.selected = !activity.selected;
    this.currentActivityName = activity;
    this._result.activity = this.currentActivity;
    this._result.activeCompany = this.userCompany;
    this._result.activityName = activity;
    if (isPlatformBrowser(this.platformId)) {
      setToLocalStorage('B2B_ACTIVITY_SELECT', this._result);
    }
    this.normalizeActivityNames();
  }

  /**
   *
   */
  onSelectAllActivitiesClick(): void {
    this._selectAllActivities = !this._selectAllActivities;
    this.activeCompanyActivities.forEach((act) => {
      act.selected = this._selectAllActivities;
      this.normalizeActivities(act);
    });
  }

  /**
   *
   */
  onSelectAllActivityNamesClick(): void {
    this._selectAllActivityNames = !this._selectAllActivityNames;
    this.activityNames.forEach((act: ActivityName) => {
      act.selected = this._selectAllActivityNames;
    });
    this.normalizeActivityNames();
  }

  /**
   *
   */
  onEditActivityClick(): void {
    this.onActivityClick(this.currentActivity);
    this.currentActivityName = null;
    this.activityNames.forEach((act: ActivityName) => act.selected = false);
    if (isPlatformBrowser(this.platformId)) {
      removeFromLocalStorage('B2B_ACTIVITY_SELECT');
    }
    this.activityEditChange.emit();
  }

  /**
   * Normalize activities
   */
  private normalizeActivities(activity: ActivityName): void {
    if (!activity.selected && this.activityNames) {
      this.activityNames
        .filter((act: ActivityName) => act.parentKey === activity.embeddedName)
        .forEach((act: ActivityName) => act.selected = false);
    }
    this._result = {};
    this.activityNames = [];
    this.activeCompanyActivities
      .filter((act: ActivityName) => act.selected)
      .forEach((act: ActivityName) => {
        const prop = act.embeddedName;
        if (!act.selected && activity.embeddedName === prop) {
          this._result[prop] = [];
        } else if (!this._result[prop] || !this._result[prop].length) {
          this._result[prop] = [];
        }
        const activityNames = this.userCompany[prop];
        activityNames.forEach(act => {
          act.ordersCount = this._ordersCount[act.id];
        });
        const activityNamesFiltered = activityNames.filter(act1 => {
          if (this.onlyActivitiesWithIds) {
            return this.onlyActivitiesWithIds[act1.parentKey].indexOf(+act1.id) !== -1;
          }
          return true;
        });

        this.activityNames = [...this.activityNames, ...activityNamesFiltered];
      });
    this.activityChange.emit(this.activeCompanyActivities.filter(item => item.selected));
  }

  /**
   * Normalize activity names
   */
  private normalizeActivityNames(): void {
    this.activityNames.forEach((act: ActivityName) => this._result[act.parentKey] = []);
    this.activityNames
      .filter((act: ActivityName) => act.selected)
      .forEach((act: ActivityName) => this._result[act.parentKey].push(+act.id));
    this._result.activities = this.activeCompanyActivities.filter(item => item.selected);
    this._result.activityNames = this.activityNames.filter(item => item.selected);
    this.activityNameChange.emit(this._result);
  }

  private showCompanyActivities() {
    this.activities.forEach(key => this.normalizeUrl(this.userCompany, key));

    if (this._activitiesSub && !this._activitiesSub.closed) {
      this._activitiesSub.unsubscribe();
    }

    this._activitiesSub = this.getActivityNames().subscribe();
  }

  private getActivityNames(): Observable<any> {
    return this._activityNameService.getActivityNames()
      .pipe(
        map((activityNames: ActivityName[]) => {
          return this.activeCompanyActivities = activityNames
            .filter(activityName => this.activities.includes(activityName.embeddedName))
            .filter(activityName => this.userCompany[activityName.embeddedName].length > 0)
            .filter(activityName => {
              return this.userCompany[activityName.embeddedName]
                .some(_activityName => _activityName.status === 1);
            })
            .map((activityName: ActivityName) => {
              const obj = SHORT_NAME[activityName.keyName];
              activityName.shortName = obj.label;
              activityName.icon = obj.icon;
              activityName.selected = false;
              activityName.ordersCount = this._ordersCount[activityName.embeddedName];
              return activityName;
            });
        })
      );
  }

  updateCounters(ordersCount) {
    if (this.activeCompanyActivities) {
      this.activeCompanyActivities.forEach(act => {
        act.ordersCount = ordersCount[act.embeddedName];
      });
    }
    if (this.activityNames) {
      this.activityNames.forEach(actName => {
        actName.ordersCount = ordersCount[actName.id];
      });
    }
  }

  private normalizeUrl(company, key) {
    const activity = company[key] || [];
    activity.forEach((activityName) => {
      activityName.parentKey = key;
      if (activityName && activityName.logo && activityName.logo.length > 0) {
        const logo = activityName.logo[0].link;
        activityName.logoUrl = (logo && this._config.serverUrl + logo) || null;
      }
    });
  }
}
