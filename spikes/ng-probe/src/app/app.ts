import { ChangeDetectionStrategy, Component, isDevMode } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { trace } from '../reference';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  // Eager para que el árbol entero sea "sin memo" y checkNoChanges lo recorra.
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    {{ trace('app-root') }}
    <p>Modo: {{ devMode ? 'desarrollo' : 'producción' }}</p>
    <nav>
      <a routerLink="/default" queryParamsHandling="preserve" routerLinkActive="active">1. Eager</a> |
      <a routerLink="/onpush" queryParamsHandling="preserve" routerLinkActive="active">2. HijoB OnPush</a> |
      <a routerLink="/service" queryParamsHandling="preserve" routerLinkActive="active">3. Service</a>
    </nav>
    <router-outlet />
  `,
  styles: `.active { font-weight: bold; }`,
})
export class App {
  protected readonly devMode = isDevMode();
  protected readonly trace = trace;
}
