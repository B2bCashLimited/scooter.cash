import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationTypes } from '@b2b/constants';
import { ConfigService, CountersService, UserService } from '@b2b/services';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {

  types = NotificationTypes;
  userCompany = this._userService.userCompany$.value;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public counter: CountersService,
    public config: ConfigService,
    private _userService: UserService,
    private _router: Router,
  ) {
  }

  get companyId() {
    return this.userCompany && +this.userCompany.id;
  }

  get userId() {
    return this._userService.currentUser && +this._userService.currentUser.id;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    console.log(this.counter.myCounter);
    if (!this.userCompany) {
      this._userService.userCompany$
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe(res => this.userCompany = res);
    }
  }

  openProfile(): void {
    this._router.navigate(['profile']);
  }

  viewNotification(notes) {
    this.counter.viewNotification(notes)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe();
  }
}
