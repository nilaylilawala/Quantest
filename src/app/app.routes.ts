import { Routes } from '@angular/router';
import { CreateTest } from './features/create-test/create-test';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'create-test',
    pathMatch: 'full',
  },
  {
    path: 'create-test',
    component: CreateTest,
  },
];
