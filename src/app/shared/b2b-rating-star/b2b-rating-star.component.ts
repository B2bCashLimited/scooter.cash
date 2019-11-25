import { Component, OnInit, Input, OnChanges, OnDestroy, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService, UserService } from '@b2b/services';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-b2b-rating-star',
  templateUrl: './b2b-rating-star.component.html',
  styleUrls: ['./b2b-rating-star.component.scss']
})
export class B2BRatingStarComponent implements OnInit, OnChanges, OnDestroy {

  @Input() set rating(value) {
    this._rating = Math.min(value * this._ratingCoefficient, this._maxRating);
  }

  get rating() {
    return this._rating || 0;
  }

  @Input() format: 'full' | 'small' | 'onlyfull' = 'full';
  @Input() companyId: number;
  @Input() activityId: number;
  @Input() details: boolean | string; // показывать ли попап

  fullStars: string;
  allStars: string;
  isPopup = false;
  isFetched = false;
  isLoading = false;

  isActivityPartVisible = false;
  isQuizPartVisible = false;
  orientationClass = 'orient-right';

  $activityResults = new BehaviorSubject({
    orders: undefined,
    offers: undefined,
    deals: undefined,
  });
  $questions = new BehaviorSubject([]);

  private currentUser = this._userService.currentUser;
  private _maxRating = 5;
  private _ratingCoefficient = 0.25;
  private _rating: number;
  private _language = this._config.locale;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  questionLocale = 'question' + this._language;
  answerLocale = 'answer' + this._language;

  constructor(
    private _http: HttpClient,
    private _config: ConfigService,
    private el: ElementRef,
    private _translateService: TranslateService,
    private _userService: UserService,
  ) {
  }

  ngOnChanges(): void {
    this._renderStars();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.calculateOrientation();

    this._translateService.onLangChange
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((lang: any) => {
        this._language = lang.lang;
        this.questionLocale = 'question' + this._language;
        this.answerLocale = 'answer' + this._language;
      });
  }

  show() {
    if (!(this.currentUser && this.currentUser.id)) {
      return;
    }

    if (!this.details) {
      return;
    }

    this._getRatingDetails();
    this.isPopup = true;
  }

  hide(): void {
    this.isPopup = false;
  }

  private _renderStars(): void {
    // число полных звезд
    const countOfFull = Math.floor(this._rating) || 0;
    // число полузвезд
    const countOfHalf = Math.ceil(this._rating - countOfFull) || 0;
    // число пустых звезд
    const countOfEmpty = (this._maxRating - countOfFull - countOfHalf) || 0;

    const fullsArray = Array(countOfFull).fill('<i class="fa fa-star"></i>');
    const halfArray = Array(countOfHalf).fill('<i class="fa fa-star-half-o"></i>');
    const emptyArray = Array(countOfEmpty).fill('<i class="fa fa-star-o"></i>');

    this.fullStars = [].concat(fullsArray, halfArray).join('');
    this.allStars = this.fullStars + emptyArray.join('');
  }

  private calculateOrientation(): void {
    const {x, y} = this.el.nativeElement.getBoundingClientRect();
    // если есть какой то элемент в 360 пикселях справа, то рисуем окошко вправо
    const elem = document.elementFromPoint(x + 360, 10);

    if (elem) {
      this.orientationClass = 'orient-right';
    } else {
      this.orientationClass = 'orient-left';
    }
  }

  private _getRatingDetails() {
    if (this.isFetched || this.isLoading) {
      return;
    }

    this.isLoading = true;

    this._http.get(`${this._config.apiUrl}/get-rating-details?companyId=${this.companyId}&activityId=${this.activityId}`)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: any) => {
        this.isLoading = false;
        this.isFetched = true;

        const embedded = res && res._embedded;
        const ratingDetails = embedded && embedded.ratingDetails && embedded.ratingDetails[0];

        const questions = ratingDetails && ratingDetails.quizResults;
        const activityResults = ratingDetails && ratingDetails.activityResults[0];

        if (questions.length) {
          this.$questions.next(questions);
          this.isQuizPartVisible = true;
        }

        if (activityResults) {
          this.$activityResults.next(activityResults);
          this.isActivityPartVisible = true;
        }
      });
  }

}
