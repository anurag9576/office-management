import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-leaves-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './leaves-admin.html',
  styleUrl: './leaves-admin.css'
})
export class LeavesAdmin implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  leaveRequests = signal<any[]>([]);
  isLoading = signal(false);
  confirmDeletionId = signal<string | null>(null);
  userRole = signal<string>('');

  constructor() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.userRole.set(user.role || '');
    }
  }

  // Holiday Management
  holidays = signal<any[]>([]);
  showHolidayModal = signal(false);
  holidayForm = signal({
    name: '',
    date: '',
    type: 'Mandatory'
  });

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
    this.loadAllHolidays();
  }

  loadAllHolidays() {
    this.apiService.getHolidays().subscribe({
      next: (res) => {
          if (res.success) this.holidays.set(res.data);
      },
      error: (err) => console.error('Error loading holidays:', err)
    });
  }

  addHoliday() {
    if (!this.holidayForm().name || !this.holidayForm().date) {
        this.toastService.show('Please fill all holiday fields', 'error');
        return;
    }

    const date = new Date(this.holidayForm().date);
    const payload = {
        ...this.holidayForm(),
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear()
    };

    this.apiService.addHoliday(payload).subscribe({
        next: (res) => {
            if (res.success) {
                this.toastService.show('Holiday added successfully!', 'success');
                this.loadAllHolidays();
                this.holidayForm.set({ name: '', date: '', type: 'Mandatory' });
            }
        },
        error: (err) => {
            this.toastService.show(err.error?.message || 'Error adding holiday', 'error');
        }
    });
  }

  deleteHoliday(id: string) {
    if (this.confirmDeletionId() !== id) {
        this.confirmDeletionId.set(id);
        setTimeout(() => this.confirmDeletionId.set(null), 5000); // Reset after 5s
        return;
    }

    this.apiService.deleteHoliday(id).subscribe({
        next: (res) => {
            if (res.success) {
                this.confirmDeletionId.set(null);
                this.loadAllHolidays();
                this.toastService.show('Holiday deleted!', 'success');
            }
        }
    });
  }

  cancelDelete() {
    this.confirmDeletionId.set(null);
  }

  openHolidayModal() {
    this.holidayForm.set({ name: '', date: '', type: 'Mandatory' });
    this.showHolidayModal.set(true);
  }

  closeHolidayModal() {
    this.showHolidayModal.set(false);
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
          this.toastService.show(`Leave ${status} successfully!`, 'success');
          this.loadAllLeaves(); // Reload to see updated status
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error updating leave status:', err);
        this.toastService.show(err.error?.message || 'Failed to update status', 'error');
        this.isLoading.set(false);
      }
    });
  }
}
