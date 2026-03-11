import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css'
})
export class DashboardHome implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  userName = signal('User');
  availableLeaves = signal(0);
  pendingLeaves = signal(0);
  activities = signal<any[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role.toLowerCase() === 'admin') {
        console.log('Redirecting Admin from DashboardHome to Admin Dashboard');
        this.router.navigateByUrl('/dashboard/admin-home');
      } else {
        this.userName.set(user.name);
        this.loadLeaveStats();
        this.loadActivities();
      }
    }
  }

  loadActivities() {
    this.apiService.getMyNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          // Take last 5 activities
          this.activities.set(res.data.slice(0, 5));
        }
      },
      error: (err) => console.error('Error loading dashboard activities:', err)
    });
  }

  getActivityIcon(type: string): string {
    switch(type) {
      case 'request': return 'event_busy';
      case 'system': return 'payments';
      case 'success': return 'check_circle';
      case 'alert': return 'warning';
      default: return 'notifications';
    }
  }

  getActivityColor(type: string): string {
    switch(type) {
      case 'request': return 'bg-amber-500';
      case 'system': return 'bg-green-500';
      case 'success': return 'bg-emerald-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-brand-1';
    }
  }

  loadLeaveStats() {
    this.isLoading.set(true);
    this.apiService.getMyLeaves().subscribe({
      next: (res) => {
        if (res.success && res.stats) {
          this.availableLeaves.set(res.stats.available);
          this.pendingLeaves.set(res.stats.pending);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching dashboard leave stats:', err);
        this.isLoading.set(false);
      }
    });
  }
}
