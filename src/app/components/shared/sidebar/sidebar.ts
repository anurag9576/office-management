import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { SidebarService } from '../../../services/sidebar.service';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route: string;
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

  // Admin Specific Tabs
  public adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/admin-home' },
    { label: 'Employee Mgmt', icon: 'group', route: '/dashboard/employees' },
    { label: 'Roles Mgmt', icon: 'manage_accounts', route: '/dashboard/roles' },
    { label: 'Attendance', icon: 'event_available', route: '/dashboard/attendance' },
    { label: 'Leave Mgmt', icon: 'event_busy', route: '/dashboard/leaves-admin' },
    { label: 'Payroll', icon: 'payments', route: '/dashboard/payroll-admin' },
    { label: 'Tasks', icon: 'task', route: '/dashboard/tasks' },
    { label: 'Reports', icon: 'analytics', route: '/dashboard/reports' },
    { label: 'Announcement', icon: 'campaign', route: '/dashboard/announcement' },
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings' },
  ];

  // Employee Specific Tabs
  public employeeNavItems: NavItem[] = [
    { label: 'Dashboard Home', icon: 'dashboard', route: '/dashboard' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile' },
    { label: 'Leaves', icon: 'vacation', route: '/dashboard/leaves' },
    { label: 'Payroll', icon: 'payments', route: '/dashboard/payroll' },
    { label: 'Announcement', icon: 'campaign', route: '/dashboard/announcement' },
    { label: 'Help', icon: 'help_outline', route: '/dashboard/help' },
  ];

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
  }
  
  constructor(
    private router: Router,
    public sidebarService: SidebarService
  ) {
    // Auto-close mobile sidebar on route change
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
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }
  
  // Reactive Navigation Items based on Role
  navItems = computed(() => {
    const userRole = (this.user().role || 'Employee').toLowerCase();
    console.log('Sidebar rendering for role:', userRole);
    return userRole === 'admin' ? this.adminNavItems : this.employeeNavItems;
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
