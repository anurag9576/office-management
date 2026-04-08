import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-leaves-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaves-summary.html',
  styleUrl: './leaves-summary.css',
})
export class LeavesSummary implements OnInit {
  private apiService = inject(ApiService);
  summary = signal<any[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.apiService.getLeaveSummary().subscribe({
      next: (res) => {
        if (res.success) {
          // Only show employees who have taken leaves or have some history
          const filtered = res.data.filter((emp: any) => emp.taken > 0 || emp.latestAction !== null);
          this.summary.set(filtered);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading leave summary:', err);
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }
}
