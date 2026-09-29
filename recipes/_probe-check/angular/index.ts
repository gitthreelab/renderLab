import { Component, Injectable, inject, signal } from '@angular/core';

// Fixture de la sonda Angular (variante 3 del spike T01b). Todos los
// componentes usan la estrategia por defecto de Angular 22: OnPush.
//
// Al pulsar "Sumar" deben refrescarse Boton (su listener lo marca como sucio,
// a él y a sus ancestros), sus ancestros e HijoA (lee el signal). Padre no lo
// lee y HijoB es estático: ninguno de los dos se refresca.

@Injectable({ providedIn: 'root' })
class CounterStore {
  readonly count = signal(0);

  sumar(): void {
    this.count.update((c) => c + 1);
  }
}

@Component({
  selector: 'probe-check-hijo-a',
  template: '<p>HijoA: {{ store.count() }}</p>',
})
class HijoA {
  protected readonly store = inject(CounterStore);
}

@Component({
  selector: 'probe-check-hijo-b',
  template: '<p>HijoB</p>',
})
class HijoB {}

@Component({
  selector: 'probe-check-padre',
  imports: [HijoA, HijoB],
  template: `
    <h2>Padre (no lee count)</h2>
    <probe-check-hijo-a />
    <probe-check-hijo-b />
  `,
})
class Padre {}

@Component({
  selector: 'probe-check-boton',
  template: '<button type="button" (click)="store.sumar()">Sumar</button>',
})
class Boton {
  protected readonly store = inject(CounterStore);
}

// Boton y Padre son hermanos: el clic no marca como sucio a Padre.
@Component({
  selector: 'probe-check-root',
  imports: [Boton, Padre],
  template: `
    <probe-check-boton />
    <probe-check-padre />
  `,
})
export default class ProbeCheck {}
