import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideCheckNoChangesConfig,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideReferencePhases } from '../reference';

// Solo para el spike: `?cnc=exhaustive` fuerza que checkNoChanges re-evalúe
// todas las vistas (también OnPush); `?cnc=interval` lo lanza además cada 2 s
// fuera de ApplicationRef.tick(). Sirve para estresar la exclusión de la sonda.
const cnc = new URLSearchParams(location.search).get('cnc');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...(cnc === 'exhaustive' ? [provideCheckNoChangesConfig({ exhaustive: true })] : []),
    ...(cnc === 'interval' ? [provideCheckNoChangesConfig({ exhaustive: true, interval: 2000 })] : []),
    // Referencia temporal para validar la sonda.
    provideReferencePhases(),
  ]
};
