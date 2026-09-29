import { Component } from '@angular/core';
import { trace } from '../../reference';

@Component({
  selector: 'app-service-hijo-b',
  template: `{{ trace('app-service-hijo-b') }}<p>HijoB</p>`,
})
export class ServiceHijoB {
  protected readonly trace = trace;
}
