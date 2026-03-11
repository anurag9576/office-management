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
  isLoading = signal(false);

  ngOnInit() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role.toLowerCase() === 'admin') {
        console.log('Redirecting Admin from DashboardHome to Admin Dashboard');
        this.router.navigateByUrl('/dashboard/admin-home');
      } else {
        this.userName.set(user.name.split(' ')[0]);
        this.loadLeaveStats();
      }
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
