import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DefaultHijoA } from './hijo-a';
import { DefaultHijoB } from './hijo-b';
import { trace } from '../../reference';

@Component({
  selector: 'app-default-padre',
  imports: [DefaultHijoA, DefaultHijoB],
  // En Angular 22 OnPush es el valor por defecto: Eager hay que pedirlo.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    {{ trace('app-default-padre') }}
    <h2>Padre: {{ count() }}</h2>
    <button (click)="sumar()">Sumar</button>
    <app-default-hijo-a [count]="count()" />
    <app-default-hijo-b />
  `,
})
export class DefaultPadre {
  protected readonly count = signal(0);
  protected readonly trace = trace;

  protected sumar(): void {
    this.count.update((c) => c + 1);
  }
}
