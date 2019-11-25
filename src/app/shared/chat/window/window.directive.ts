import { Directive, Inject, ElementRef, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appAutofocus]'
})
export class ChatFocusDirective implements OnInit {
  private focus = true;

  @Input() set appAutofocus(condition: boolean) {
    this.focus = condition !== false;
  }

  constructor(@Inject(ElementRef) private element: ElementRef) {
  }

  ngOnInit(): void {
    if (this.focus) {
      this.element.nativeElement.focus();
    }
  }
}
