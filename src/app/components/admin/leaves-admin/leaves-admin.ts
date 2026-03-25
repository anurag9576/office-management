import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-leaves-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaves-admin.html',
  styleUrl: './leaves-admin.css'
})
export class LeavesAdmin implements OnInit {
  private apiService = inject(ApiService);
  leaveRequests = signal<any[]>([]);
  isLoading = signal(false);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  paginatedRequests = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.leaveRequests().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.leaveRequests().length / this.itemsPerPage) || 1;
  });

  startRange = computed(() => {
    if (this.leaveRequests().length === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  });

  endRange = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage, this.leaveRequests().length);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  ngOnInit() {
    this.loadAllLeaves();
  }

  loadAllLeaves() {
    this.isLoading.set(true);
    this.apiService.getAllLeaves().subscribe({
      next: (res) => {
        if (res.success) {
          this.leaveRequests.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching all leaves:', err);
        this.isLoading.set(false);
      }
    });
  }

  approveLeave(id: string) {
    this.updateStatus(id, 'Approved');
  }

  rejectLeave(id: string) {
    this.updateStatus(id, 'Rejected');
  }

  private updateStatus(id: string, status: string) {
    this.isLoading.set(true);
    this.apiService.updateLeaveStatus(id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAllLeaves(); // Reload to see updated status
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error updating leave status:', err);
        alert(err.error?.message || 'Failed to update status');
        this.isLoading.set(false);
      }
    });
  }
}
