import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';
import { trace } from '../../reference';

@Component({
  selector: 'app-service-hijo-a',
  template: `{{ trace('app-service-hijo-a') }}<p>HijoA: {{ store.count() }}</p>`,
})
export class ServiceHijoA {
  protected readonly store = inject(CounterStore);
  protected readonly trace = trace;
}
