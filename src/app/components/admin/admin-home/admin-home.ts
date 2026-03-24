import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css'
})
export class AdminHome implements OnInit {
  private apiService = inject(ApiService);

  stats = signal([
    { label: 'Total Employees', value: '...', icon: 'group', color: 'bg-brand-1', bgOp5: 'bg-brand-1/5', bgOp10: 'bg-brand-1/10', textCls: 'text-brand-1', trend: 'Loading...' },

    { label: 'Pending Leaves', value: '...', icon: 'event_busy', color: 'bg-amber-500', bgOp5: 'bg-amber-500/5', bgOp10: 'bg-amber-500/10', textCls: 'text-amber-500', trend: 'Loading...' },
    { label: 'Active Projects', value: '24', icon: 'rocket_launch', color: 'bg-brand-1', bgOp5: 'bg-brand-1/5', bgOp10: 'bg-brand-1/10', textCls: 'text-brand-1', trend: 'Across 4 Depts' }
  ]);

  recentActions = signal<any[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // 1. Live Total Employees
    this.apiService.getEmployees().subscribe({
      next: (res) => {
        if (res.success) {
          const count = res.data.length;
          this.stats.update(s => {
            const newStats = [...s];
            newStats[0].value = count.toString();
            newStats[0].trend = 'Active in DB';
            return newStats;
          });
        }
      },
      error: (err) => console.error('Error fetching employees:', err)
    });

    // 2. Live Pending Leaves
    this.apiService.getAllLeaves().subscribe({
      next: (res) => {
        if (res.success) {
          const pendingCount = res.data.filter((l: any) => l.status === 'Pending').length;
          this.stats.update(s => {
            const newStats = [...s];
            newStats[1].value = pendingCount.toString();
            newStats[1].trend = pendingCount > 0 ? 'Needs Action' : 'All Clear';
            return newStats;
          });
        }
      },
      error: (err) => console.error('Error fetching leaves:', err)
    });

    // 3. Live Audit Logs / Notifications
    this.apiService.getMyNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          const formatted = res.data.slice(0, 50).map((n: any) => ({
            admin: 'System',
            action: `${n.title}: ${n.message}`,
            time: this.getTimeAgo(n.createdAt)
          }));
          this.recentActions.set(formatted);
        }
      },
      error: (err) => console.error('Error fetching logs:', err)
    });
  }

  private getTimeAgo(dateStr: string): string {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${Math.max(1, min)} MINS AGO`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} HOURS AGO`;
    return `${Math.floor(hrs / 24)} DAYS AGO`;
  }
}
