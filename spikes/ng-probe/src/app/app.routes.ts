import { Routes } from '@angular/router';
import { DefaultPadre } from './v1-default/padre';
import { OnPushPadre } from './v2-onpush/padre';
import { ServiceRuta } from './v3-service/ruta';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'default' },
  { path: 'default', component: DefaultPadre, title: '1. Eager (sin memo)' },
  { path: 'onpush', component: OnPushPadre, title: '2. HijoB OnPush (memo)' },
  { path: 'service', component: ServiceRuta, title: '3. Service con signal' },
];
