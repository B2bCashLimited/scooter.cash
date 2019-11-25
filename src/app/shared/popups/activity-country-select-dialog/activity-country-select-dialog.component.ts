import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Activities } from '@b2b/constants';
import { ConfigService } from '@b2b/services';

@Component({
  selector: 'app-activity-country-select-dialog',
  templateUrl: './activity-country-select-dialog.component.html',
  styleUrls: ['./activity-country-select-dialog.component.scss']
})
export class ActivityCountrySelectDialogComponent implements OnInit {

  chosenActivity: string;
  activities: string[];
  chosenActivityId: number;
  chosenActNameId: number;
  chosenCountry: any;
  companyActivities = [
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
    Activities.WAREHOUSES_RENTS
  ];
  companyId: number;
  confirmed = false;
  confirmOrder;

  constructor(
    public config: ConfigService,
    private dialogRef: MatDialogRef<ActivityCountrySelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.confirmOrder = this.data && this.data.confirmOrder;
    if (this.data && this.data.activityNames && this.data.activityNames.length) {
      this.activities = this.data.activityNames;
    } else {
      this.activities = this.companyActivities;
    }
  }

  fdListener(evt) {
    this.companyId = +evt.activeCompany.id;
    this.chosenActivity = evt.activity.keyName;
    this.chosenActNameId = evt.activity.id;
    this.chosenActivityId = +evt.activityName.id;
  }

  initalState() {
    this.companyId = 0;
    this.chosenActivity = '';
    this.chosenActNameId = 0;
    this.chosenActivityId = 0;
  }

  submit() {
    this.dialogRef.close({
      selectedActivity: {
        companyId: +this.companyId,
        activityKey: this.chosenActivity,
        activityId: +this.chosenActivityId
      },
      actNameId: +this.chosenActNameId
      // countryId: this.chosenCountry.id
    });
  }
}
