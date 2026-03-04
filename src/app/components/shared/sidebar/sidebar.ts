import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  brandName = signal('hamsa hitech');
  showLogoutModal = signal(false);
  
  constructor(private router: Router) {}
  
  user = signal({
    name: 'Ankit Sharma',
    role: 'Employee',
    initials: 'AS'
  });
  
  navItems = signal<NavItem[]>([
    { label: 'Dashboard Home', icon: 'dashboard', route: '/dashboard' },
    { label: 'Leaves', icon: 'vacation', route: '/leaves' },
    { label: 'Payroll', icon: 'payments', route: '/payroll' },
    { label: 'Attendance', icon: 'calendar_month', route: '/attendance' },
    { label: 'Profile', icon: 'person', route: '/profile' },
    { label: 'Help', icon: 'help_outline', route: '/help' },
  ]);

  onLogout() {
    this.showLogoutModal.set(true);
  }

  confirmLogout() {
    this.showLogoutModal.set(false);
    this.router.navigate(['/login']);
  }

  cancelLogout() {
    this.showLogoutModal.set(false);
  }
}
