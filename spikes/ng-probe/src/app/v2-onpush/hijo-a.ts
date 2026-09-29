import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { trace } from '../../reference';

@Component({
  selector: 'app-onpush-hijo-a',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `{{ trace('app-onpush-hijo-a') }}<p>HijoA: {{ count() }}</p>`,
})
export class OnPushHijoA {
  readonly count = input.required<number>();
  protected readonly trace = trace;
}
