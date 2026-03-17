import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';
import { ApiService } from '../../../services/api.service';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HostListener } from '@angular/core';

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
  private serverUrl = environment.serverUrl;

  currentTime = new Date();
  showNotificationsDropdown = signal(false);
  currentTitle = signal('Dashboard');
  unreadCount = signal(0);
  user = signal({
    name: 'User',
    role: 'Employee',
    initials: 'U',
    avatar: null as string | null
  });
  imageError = signal(false);
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
    this.loadUserInfo();
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

  private loadUserInfo() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const name = parsedUser.name || 'User';
        const role = parsedUser.role || 'Employee';
        const initials = parsedUser.initials || name.charAt(0).toUpperCase();
        const avatar = parsedUser.avatar || null;
        this.imageError.set(false); // Reset error state on reload
        this.user.set({ 
          name, 
          role, 
          initials, 
          avatar: this.getFullAvatarUrl(avatar) 
        });
      } catch (e) {
        console.error('Error parsing user data in Navbar', e);
      }
    }
  }

  onImageError() {
    this.imageError.set(true);
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent) {
    if (event.key === 'currentUser') {
      this.loadUserInfo();
    }
  }

  private getFullAvatarUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `${this.serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  toggleNotifications() {
    this.showNotificationsDropdown.set(!this.showNotificationsDropdown());
  }

  navigateToProfile() {
    this.router.navigate(['/dashboard/profile']);
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
