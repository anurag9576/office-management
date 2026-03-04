import { Routes } from '@angular/router';
import { Login } from './components/core/login/login';
import { ForgotPassword } from './components/core/forgot-password/forgot-password';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
