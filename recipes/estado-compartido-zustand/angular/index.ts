import { Component, Injectable, inject, signal } from '@angular/core';

// Estado compartido con un service y signals. Todos los componentes usan la
// estrategia por defecto de Angular 22: OnPush.
//
// Al pulsar "Sumar" se refrescan Boton (su listener lo marca como sucio, a él y
// a sus ancestros), App (ancestro de Boton) y VerContador (su template lee el
// signal contador). VerNombre lee otro signal y Estatico no lee nada: ninguno
// de los dos se refresca.

@Injectable()
class Estado {
  readonly contador = signal(0);
  readonly nombre = signal('Ada');

  sumar(): void {
    this.contador.update((n) => n + 1);
  }
}

@Component({
  selector: 'estado-compartido-zustand-boton',
  template: '<button type="button" (click)="estado.sumar()">Sumar</button>',
})
class Boton {
  protected readonly estado = inject(Estado);
}

@Component({
  selector: 'estado-compartido-zustand-ver-contador',
  template: '<p>Contador: {{ estado.contador() }}</p>',
})
class VerContador {
  protected readonly estado = inject(Estado);
}

@Component({
  selector: 'estado-compartido-zustand-ver-nombre',
  template: '<p>Nombre: {{ estado.nombre() }}</p>',
})
class VerNombre {
  protected readonly estado = inject(Estado);
}

@Component({
  selector: 'estado-compartido-zustand-estatico',
  template: '<p>Soy estático</p>',
})
class Estatico {}

// Provee Estado en App y no en root: cada receta tiene su propia instancia.
@Component({
  selector: 'estado-compartido-zustand-root',
  imports: [Boton, VerContador, VerNombre, Estatico],
  providers: [Estado],
  template: `
    <estado-compartido-zustand-boton />
    <estado-compartido-zustand-ver-contador />
    <estado-compartido-zustand-ver-nombre />
    <estado-compartido-zustand-estatico />
  `,
})
export default class App {}
