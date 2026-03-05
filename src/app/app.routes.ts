import { Routes } from '@angular/router';
import { Login } from './components/core/login/login';
import { ForgotPassword } from './components/core/forgot-password/forgot-password';
import { Dashboard } from './components/dashboard/dashboard';
import { DashboardHome } from './components/dashboard/dashboard-home/dashboard-home';
import { Leaves } from './components/dashboard/leaves/leaves';
import { Announcement } from './components/dashboard/announcement/announcement';
import { Payroll } from './components/dashboard/payroll/payroll';
import { Profile } from './components/dashboard/profile/profile';
import { Help } from './components/dashboard/help/help';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { 
    path: 'dashboard', 
    component: Dashboard,
    children: [
      { path: '', component: DashboardHome },
      { path: 'leaves', component: Leaves },
      { path: 'announcement', component: Announcement },
      { path: 'payroll', component: Payroll },
      { path: 'profile', component: Profile },
      { path: 'help', component: Help },
      // Other feature routes will go here
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
