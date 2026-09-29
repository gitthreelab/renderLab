import { Component } from '@angular/core';
import { ServiceBoton } from './boton';
import { ServicePadre } from './padre';
import { trace } from '../../reference';

// Componente de la ruta: Boton y Padre son hermanos, así el clic no marca
// como sucio a Padre ni a sus hijos. Sin `changeDetection`: OnPush por defecto.
@Component({
  selector: 'app-service-ruta',
  imports: [ServiceBoton, ServicePadre],
  template: `
    {{ trace('app-service-ruta') }}
    <app-service-boton />
    <app-service-padre />
  `,
})
export class ServiceRuta {
  protected readonly trace = trace;
}
