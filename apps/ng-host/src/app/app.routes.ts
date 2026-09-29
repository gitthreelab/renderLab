import { Routes } from '@angular/router';
import { Health } from './health';
import { recipeRoutes } from './recipe.routes.generated';

export const routes: Routes = [{ path: '', component: Health }, ...recipeRoutes];
