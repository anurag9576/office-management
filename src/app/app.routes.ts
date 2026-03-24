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

import { TaskMgmt } from './components/admin/tasks/tasks';
import { Reports } from './components/admin/reports/reports';
import { SettingsAdmin } from './components/admin/settings/settings';
import { LeavesAdmin } from './components/admin/leaves-admin/leaves-admin';
import { PayrollAdmin } from './components/admin/payroll-admin/payroll-admin';
import { AdminHome } from './components/admin/admin-home/admin-home';
import { Timesheet } from './components/dashboard/timesheet/timesheet';
import { TimesheetAdmin } from './components/admin/timesheet-admin/timesheet-admin';
import { authGuard } from './guards/auth.guard';
import { DocumentsAdmin } from './components/admin/documents/documents-admin';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardHome, data: { role: 'Employee' } },
      { path: 'admin-home', component: AdminHome, data: { role: 'Admin', permission: 'dashboard' } },
      { path: 'employees', component: EmployeesMgmt, data: { role: 'Admin', permission: 'employees' } },
      { path: 'departments', component: DepartmentsMgmt, data: { role: 'Admin', permission: 'employees' } },
      { path: 'roles', component: RolesMgmt, data: { role: 'Admin', permission: 'roles' } },
      { path: 'leaves', component: Leaves }, 
      { path: 'timesheet', component: Timesheet, data: { permission: 'timesheet' } },
      { path: 'timesheet-admin', component: TimesheetAdmin, data: { role: 'Admin', permission: 'timesheet-admin' } },
      { path: 'leaves-admin', component: LeavesAdmin, data: { role: 'Admin', permission: 'leaves-admin' } },
      { path: 'announcement', component: Announcement },
      { path: 'payroll', component: Payroll, data: { role: 'Employee' } },
      { path: 'payroll-admin', component: PayrollAdmin, data: { role: 'Admin', permission: 'payroll-admin' } },
      { path: 'tasks', component: TaskMgmt },
      { path: 'reports', component: Reports, data: { role: 'Admin', permission: 'reports' } },
      { path: 'settings', component: SettingsAdmin, data: { role: 'Admin', permission: 'settings' } },
      { path: 'documents-admin', component: DocumentsAdmin, data: { role: 'Admin', permission: 'documents' } },
      { path: 'profile', component: Profile },
      { path: 'help', component: Help },
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
