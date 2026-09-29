import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { OnPushHijoA } from './hijo-a';
import { OnPushHijoB } from './hijo-b';
import { trace } from '../../reference';

@Component({
  selector: 'app-onpush-padre',
  imports: [OnPushHijoA, OnPushHijoB],
  // En Angular 22 OnPush es el valor por defecto: Eager hay que pedirlo.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    {{ trace('app-onpush-padre') }}
    <h2>Padre: {{ count() }}</h2>
    <button (click)="sumar()">Sumar</button>
    <app-onpush-hijo-a [count]="count()" />
    <app-onpush-hijo-b />
  `,
})
export class OnPushPadre {
  protected readonly count = signal(0);
  protected readonly trace = trace;

  protected sumar(): void {
    this.count.update((c) => c + 1);
  }
}
