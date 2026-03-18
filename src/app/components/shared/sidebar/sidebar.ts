import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { SidebarService } from '../../../services/sidebar.service';
import { filter } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permissionKey?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  brandName = signal('hamsa hitech');
  showLogoutModal = signal(false);
  isCollapsed = signal(window.innerWidth < 768);
  permissions = signal<string[]>([]);

  // Admin Specific Tabs
  public adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/admin-home', permissionKey: 'dashboard' },
    { label: 'Employee Mgmt', icon: 'group', route: '/dashboard/employees', permissionKey: 'employees' },
    { label: 'Roles Mgmt', icon: 'manage_accounts', route: '/dashboard/roles', permissionKey: 'roles' },
    { label: 'Attendance', icon: 'event_available', route: '/dashboard/attendance', permissionKey: 'attendance' },
    { label: 'Leave Mgmt', icon: 'event_busy', route: '/dashboard/leaves-admin', permissionKey: 'leaves-admin' },
    { label: 'Payroll', icon: 'payments', route: '/dashboard/payroll-admin', permissionKey: 'payroll-admin' },
    { label: 'Tasks', icon: 'task', route: '/dashboard/tasks', permissionKey: 'tasks' },
    { label: 'Reports', icon: 'analytics', route: '/dashboard/reports', permissionKey: 'reports' },
    { label: 'Announcement', icon: 'campaign', route: '/dashboard/announcement', permissionKey: 'announcement' },
    { label: 'Timesheet Reports', icon: 'pending_actions', route: '/dashboard/timesheet-admin', permissionKey: 'timesheet-admin' },
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings', permissionKey: 'settings' },
  ];

  // Employee Specific Tabs
  public employeeNavItems: NavItem[] = [
    { label: 'Dashboard Home', icon: 'dashboard', route: '/dashboard', permissionKey: 'dashboard' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile', permissionKey: 'profile' },
    { label: 'Timesheet', icon: 'timer', route: '/dashboard/timesheet', permissionKey: 'timesheet' },
    { label: 'Leaves', icon: 'vacation', route: '/dashboard/leaves', permissionKey: 'leaves' },
    { label: 'Payroll', icon: 'payments', route: '/dashboard/payroll', permissionKey: 'payroll' },
    { label: 'Announcement', icon: 'campaign', route: '/dashboard/announcement', permissionKey: 'announcement' },
    { label: 'Help', icon: 'help_outline', route: '/dashboard/help', permissionKey: 'help' },
  ];

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }
  
  constructor(
    private router: Router,
    public sidebarService: SidebarService,
    private apiService: ApiService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.sidebarService.closeMobile();
    });

    this.loadUserInfo();
  }

  user = signal({
    name: 'User',
    role: 'Employee',
    initials: 'U'
  });

  private loadUserInfo() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const name = parsedUser.name || 'User';
        const role = parsedUser.role || 'Employee';
        const initials = parsedUser.initials || name.charAt(0).toUpperCase();

        this.user.set({ name, role, initials });
        console.log('Sidebar loaded user:', name, 'Role:', role);
        
        this.loadPermissions(role);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  private loadPermissions(role: string) {
    this.apiService.getRolePermissions(role).subscribe({
      next: (res) => {
        if (res.success) {
          this.permissions.set(res.permissions);
          localStorage.setItem('userPermissions', JSON.stringify(res.permissions));
        }
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.permissions.set(['dashboard', 'profile', 'leaves', 'payroll', 'announcement', 'help']);
      }
    });
  }
  
  navItems = computed(() => {
    const userRole = (this.user().role || 'Employee').toLowerCase();
    const currentPermissions = this.permissions();
    
    const allItems = userRole === 'admin' 
      ? this.adminNavItems 
      : [...this.employeeNavItems, ...this.adminNavItems.filter(i => i.permissionKey !== 'dashboard')];
    return allItems.filter(item => {
      if (!item.permissionKey) return true;
      const personalItems = ['profile', 'leaves', 'payroll', 'help'];
      if (userRole !== 'admin' && personalItems.includes(item.permissionKey)) {
        return true;
      }

      return currentPermissions.includes(item.permissionKey);
    }).filter((item, index, self) => 
      index === self.findIndex((t) => t.route === item.route)
    );
  });

  onLogout() {
    this.showLogoutModal.set(true);
  }

  confirmLogout() {
    this.showLogoutModal.set(false);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }
}
