import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterStore {
  readonly count = signal(0);

  sumar(): void {
    this.count.update((c) => c + 1);
  }
}
