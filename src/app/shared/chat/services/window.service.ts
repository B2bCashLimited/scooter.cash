import { Injectable, Inject } from '@angular/core';
import { debounceTime, distinctUntilChanged, map, pluck } from 'rxjs/operators';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { WINDOW } from '@b2b/services';

@Injectable()
export class WindowService {
  width$: Observable<number>;
  height$: Observable<number>;

  constructor(@Inject(WINDOW) private window: Window) {
    const windowSize$ = new BehaviorSubject(this.getWindowSize());

    this.width$ = windowSize$.pipe(
      debounceTime(300),
      pluck('width'),
      distinctUntilChanged(),
    ) as Observable<number>;

    this.height$ = windowSize$.pipe(
      debounceTime(300),
      pluck('height'),
      distinctUntilChanged(),
    ) as Observable<number>;

    fromEvent(window, 'resize')
      .pipe(map(this.getWindowSize))
      .subscribe(windowSize$);
  }

  getWindowSize(): any {
    return {
      width: this.window.innerWidth,
      height: this.window.innerHeight
    };
  }
}
