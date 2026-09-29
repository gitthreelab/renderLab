import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trace } from '../../reference';

@Component({
  selector: 'app-onpush-hijo-b',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ trace('app-onpush-hijo-b') }}<p>HijoB</p>`,
})
export class OnPushHijoB {
  protected readonly trace = trace;
}
