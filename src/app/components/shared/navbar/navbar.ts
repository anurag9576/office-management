import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../services/sidebar.service';
import { ApiService } from '../../../services/api.service';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HostListener } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);
  public sidebarService = inject(SidebarService);
  private serverUrl = environment.serverUrl;
  private fb = inject(FormBuilder);

  currentTime = signal(new Date());
  showNotificationsDropdown = signal(false);
  showProfileDropdown = signal(false);

  showLogoutModal = signal(false);
  showPasswordModal = signal(false);
  changePasswordForm: FormGroup;
  isPasswordLoading = signal(false);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);
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

  get isDesktop(): boolean {
    return window.innerWidth > 1024;
  }

  get innerWidth(): number {
    return window.innerWidth;
  }

  constructor() {
    this.changePasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

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
    // Poll every 60 seconds
    this.pollingSubscription = interval(60000).subscribe(() => {
      this.loadNotifications();
    });

    this.apiService.notificationRefresh.subscribe(() => {
      this.loadNotifications();
    });

    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
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

  toggleNotifications(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileDropdown.set(false);
    this.showNotificationsDropdown.update(v => !v);
  }

  toggleProfileDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showNotificationsDropdown.set(false);
    this.showProfileDropdown.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdowns when clicking outside
    this.showProfileDropdown.set(false);
    this.showNotificationsDropdown.set(false);
  }

  goToProfile() {
    this.showProfileDropdown.set(false);
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
        // Fix for old notifications
        let finalRoute = note.route;
        if (finalRoute.includes('/admin/documents')) {
           finalRoute = finalRoute.replace('/admin/documents', '/dashboard/documents-admin');
        }
        
        // Force navigation if already on the same route to ensure query params correctly propagate to state
        const currentUrl = this.router.url.split('?')[0];
        const targetUrl = finalRoute.split('?')[0];
        if (currentUrl === targetUrl) {
           this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
               this.router.navigateByUrl(finalRoute);
           });
        } else {
           this.router.navigateByUrl(finalRoute);
        }
    }
  }

  // Logout Methods
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
        next: (res: any) => {
          this.isPasswordLoading.set(false);
          this.passwordSuccess.set('Password updated successfully!');
          setTimeout(() => {
            this.closeChangePasswordModal();
          }, 2000);
        },
        error: (err: any) => {
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
