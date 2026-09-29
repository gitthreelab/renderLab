import { Component } from '@angular/core';
import { ServiceHijoA } from './hijo-a';
import { ServiceHijoB } from './hijo-b';
import { trace } from '../../reference';

// Sin `changeDetection`: OnPush, el valor por defecto en Angular 22.
@Component({
  selector: 'app-service-padre',
  imports: [ServiceHijoA, ServiceHijoB],
  template: `
    {{ trace('app-service-padre') }}
    <h2>Padre (no lee count)</h2>
    <app-service-hijo-a />
    <app-service-hijo-b />
  `,
})
export class ServicePadre {
  protected readonly trace = trace;
}
