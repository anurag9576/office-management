import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  currentTime = new Date();
  showSettingsDropdown = signal(false);
  showNotificationsDropdown = signal(false);
  currentTitle = signal('Dashboard');

  notifications = [
    // ... notifications content remains same
    {
      id: 1,
      title: 'New Leave Request',
      message: 'Anurag has applied for sick leave.',
      time: '2 mins ago',
      type: 'request',
      icon: 'event_busy',
      color: 'text-amber-500 bg-amber-50'
    },
    {
      id: 2,
      title: 'Payroll Processed',
      message: 'February payroll is ready for review.',
      time: '1 hour ago',
      type: 'system',
      icon: 'payments',
      color: 'text-green-500 bg-green-50'
    },
    {
      id: 3,
      title: 'Announcement',
      message: 'New office policy update for 2026.',
      time: '5 hours ago',
      type: 'info',
      icon: 'campaign',
      color: 'text-blue-500 bg-blue-50'
    }
  ];

  constructor(
    private router: Router,
    public sidebarService: SidebarService
  ) {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Dynamic Title Logic
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects);
    });

    // Initial title
    this.updateTitle(this.router.url);
  }

  private updateTitle(url: string) {
    if (url.includes('admin-home')) this.currentTitle.set('Admin Dashboard');
    else if (url.includes('employees')) this.currentTitle.set('Employee Mgmt');
    else if (url.includes('departments')) this.currentTitle.set('Dept Mgmt');
    else if (url.includes('roles')) this.currentTitle.set('Roles Mgmt');
    else if (url.includes('attendance')) this.currentTitle.set('Attendance');
    else if (url.includes('leaves-admin')) this.currentTitle.set('Leave Mgmt');
    else if (url.includes('payroll-admin')) this.currentTitle.set('Payroll');
    else if (url.includes('tasks')) this.currentTitle.set('Tasks');
    else if (url.includes('reports')) this.currentTitle.set('Reports');
    else if (url.includes('announcement')) this.currentTitle.set('Announcement');
    else if (url.includes('settings')) this.currentTitle.set('Settings');
    else if (url.includes('profile')) this.currentTitle.set('Profile');
    else if (url.includes('leaves')) this.currentTitle.set('Leaves');
    else if (url.includes('payroll')) this.currentTitle.set('Payroll');
    else if (url.includes('help')) this.currentTitle.set('Help');
    else this.currentTitle.set('Dashboard');
  }

  toggleSettings() {
    this.showNotificationsDropdown.set(false);
    this.showSettingsDropdown.set(!this.showSettingsDropdown());
  }

  toggleNotifications() {
    this.showSettingsDropdown.set(false);
    this.showNotificationsDropdown.set(!this.showNotificationsDropdown());
  }

  navigateToForgot() {
    this.showSettingsDropdown.set(false);
    this.router.navigate(['/forgot-password']);
  }
}
