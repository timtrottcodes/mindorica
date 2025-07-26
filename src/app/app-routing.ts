// src/app/app-routing.ts
import { Routes, provideRouter } from '@angular/router';
import { Home } from './pages/home/home';
import { Topics } from './pages/topics/topics';
import { Import } from './pages/import/import';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'topics', component: Topics },
  { path: 'import', component: Import },
];

export const appRouterProviders = [
  provideRouter(routes),
];
