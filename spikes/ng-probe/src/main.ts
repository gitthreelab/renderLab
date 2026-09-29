// La sonda se importa antes que nada: deja preparado el hook en window.ng
// antes de que bootstrapApplication cree la plataforma.
import './probe';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
