import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { trace } from '../../reference';

@Component({
  selector: 'app-default-hijo-a',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `{{ trace('app-default-hijo-a') }}<p>HijoA: {{ count() }}</p>`,
})
export class DefaultHijoA {
  readonly count = input.required<number>();
  protected readonly trace = trace;
}
