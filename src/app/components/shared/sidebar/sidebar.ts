import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { SidebarService } from '../../../services/sidebar.service';
import { filter } from 'rxjs/operators';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permissionKey?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  brandName = signal('hamsa hitech');
  showLogoutModal = signal(false);
  private serverUrl = environment.serverUrl;
  isCollapsed = signal(window.innerWidth < 768);
  permissions = signal<string[]>([]);

  showPasswordModal = signal(false);
  changePasswordForm: FormGroup;
  isPasswordLoading = signal(false);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

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
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings', permissionKey: 'settings' },
  ];

  // Employee Specific Tabs
  public employeeNavItems: NavItem[] = [
    { label: 'Dashboard Home', icon: 'dashboard', route: '/dashboard', permissionKey: 'dashboard' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile', permissionKey: 'profile' },
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
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.changePasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
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
    initials: 'U',
    avatar: null as string | null
  });

  private getFullAvatarUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `${this.serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private loadUserInfo() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const name = parsedUser.name || 'User';
        const role = parsedUser.role || 'Employee';
        const initials = parsedUser.initials || name.charAt(0).toUpperCase();
        const avatar = parsedUser.avatar || null;

        this.user.set({ name, role, initials, avatar: this.getFullAvatarUrl(avatar) });
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

  mainNavItems = computed(() => {
    return this.navItems().filter(item => item.label !== 'Help' && item.label !== 'Settings');
  });

  bottomNavItems = computed(() => {
    return this.navItems().filter(item => item.label === 'Help' || item.label === 'Settings');
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

  // Password Methods
  openChangePasswordModal() {
    this.changePasswordForm.reset();
    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.showPasswordModal.set(true);
    if (this.sidebarService.isMobileOpen()) {
        this.sidebarService.closeMobile();
    }
  }

  closeChangePasswordModal() {
    this.showPasswordModal.set(false);
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmitPassword() {
    if (this.changePasswordForm.valid) {
      this.isPasswordLoading.set(true);
      this.passwordError.set(null);

      const { newPassword } = this.changePasswordForm.value;

      this.apiService.changePassword({ newPassword }).subscribe({
        next: (res) => {
          this.isPasswordLoading.set(false);
          this.passwordSuccess.set('Password updated successfully!');
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 2000);
        },
        error: (err) => {
          this.isPasswordLoading.set(false);
          this.passwordError.set(err.error?.message || 'Failed to update password.');
        }
      });
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(type: 'new' | 'confirm') {
    if (type === 'new') this.passwordVisible.set(!this.passwordVisible());
    else this.confirmPasswordVisible.set(!this.confirmPasswordVisible());
  }
}
