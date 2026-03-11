import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';
import { ApiService } from '../../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);
  public sidebarService = inject(SidebarService);

  currentTime = new Date();
  showSettingsDropdown = signal(false);
  showNotificationsDropdown = signal(false);
  currentTitle = signal('Dashboard');
  unreadCount = signal(0);
  notifications: any[] = [];
  private pollingSubscription?: Subscription;
  private timeInterval: any;

  constructor() {
    // Dynamic Title Logic
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects);
    });

    // Initial title
    this.updateTitle(this.router.url);
  }

  ngOnInit() {
    this.loadNotifications();
    // Poll every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
    });

    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  loadNotifications() {
    this.apiService.getMyNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications = res.data.map((n: any) => ({
            ...n,
            color: this.getNoteColorClass(n.type)
          }));
          this.unreadCount.set(res.unreadCount);
        }
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  getNoteColorClass(type: string): string {
    switch(type) {
      case 'request': return 'text-amber-500 bg-amber-50';
      case 'system': return 'text-green-500 bg-green-50';
      case 'info': return 'text-blue-500 bg-blue-50';
      case 'alert': return 'text-red-500 bg-red-50';
      case 'success': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  }

  markAllAsRead() {
    this.apiService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.unreadCount.set(0);
      }
    });
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

  handleNotificationClick(note: any) {
    this.showNotificationsDropdown.set(false);
    
    // Mark as read if not already
    if (!note.isRead && note._id) {
        this.apiService.markNotificationAsRead(note._id).subscribe({
            next: () => {
                note.isRead = true;
                this.unreadCount.update(c => Math.max(0, c - 1));
            }
        });
    }

    if (note.route) {
        this.router.navigateByUrl(note.route);
    }
  }
}
