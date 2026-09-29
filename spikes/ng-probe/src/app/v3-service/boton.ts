import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';
import { trace } from '../../reference';

@Component({
  selector: 'app-service-boton',
  template: `{{ trace('app-service-boton') }}<button (click)="store.sumar()">Sumar</button>`,
})
export class ServiceBoton {
  protected readonly store = inject(CounterStore);
  protected readonly trace = trace;
}
