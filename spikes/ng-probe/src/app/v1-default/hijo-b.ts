import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trace } from '../../reference';

@Component({
  selector: 'app-default-hijo-b',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `{{ trace('app-default-hijo-b') }}<p>HijoB</p>`,
})
export class DefaultHijoB {
  protected readonly trace = trace;
}
