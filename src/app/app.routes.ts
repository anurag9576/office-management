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
import { EmployeesMgmt } from './components/admin/employees/employees';
import { DepartmentsMgmt } from './components/admin/departments/departments';
import { RolesMgmt } from './components/admin/roles-management/roles-management';
import { AttendanceMgmt } from './components/admin/attendance/attendance';
import { TaskMgmt } from './components/admin/tasks/tasks';
import { Reports } from './components/admin/reports/reports';
import { SettingsAdmin } from './components/admin/settings/settings';
import { LeavesAdmin } from './components/admin/leaves-admin/leaves-admin';
import { PayrollAdmin } from './components/admin/payroll-admin/payroll-admin';
import { AdminHome } from './components/admin/admin-home/admin-home';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { 
    path: 'dashboard', 
    component: Dashboard,
    children: [
      { path: '', component: DashboardHome },
      { path: 'admin-home', component: AdminHome },
      { path: 'employees', component: EmployeesMgmt },
      { path: 'departments', component: DepartmentsMgmt },
      { path: 'roles', component: RolesMgmt },
      { path: 'attendance', component: AttendanceMgmt },
      { path: 'leaves', component: Leaves },
      { path: 'leaves-admin', component: LeavesAdmin },
      { path: 'announcement', component: Announcement },
      { path: 'payroll', component: Payroll },
      { path: 'payroll-admin', component: PayrollAdmin },
      { path: 'tasks', component: TaskMgmt },
      { path: 'reports', component: Reports },
      { path: 'settings', component: SettingsAdmin },
      { path: 'profile', component: Profile },
      { path: 'help', component: Help },
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
