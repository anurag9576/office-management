import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css'
})
export class Timesheet implements OnInit {
  protected Math = Math;
  currentDate = new Date();
  maxDate = new Date().toISOString().split('T')[0];
  showModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = signal(false);
  isLoading = signal(true);
  logToDelete = signal<any>(null);
  
  // Filters
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years = [2024, 2025, 2026];

  workStatuses = ['Development', 'In Process', 'Bug Fixing', 'Testing', 'Completed', 'Documentation', 'Meeting'];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  // Real data from Backend
  logs = signal<any[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading.set(true);
    this.apiService.getMyTimesheets().subscribe({
      next: (res) => {
        if (res.success) {
          this.logs.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching timesheets:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredLogs = computed(() => {
    return this.logs().filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === Number(this.selectedMonth()) && d.getFullYear() === Number(this.selectedYear());
    });
  });

  paginatedLogs = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredLogs().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredLogs().length / this.itemsPerPage);
  });

  startRange = computed(() => {
    if (this.filteredLogs().length === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  });

  endRange = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage, this.filteredLogs().length);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  newLog: any = {
    id: 0,
    date: new Date().toISOString().split('T')[0],
    project: '',
    branchName: '',
    workStatus: '',
    task: '',
    minutes: 0
  };

  openAddModal() {
    this.isEditing.set(false);
    this.newLog = {
      date: new Date().toISOString().split('T')[0],
      project: '',
      branchName: '',
      workStatus: '',
      task: '',
      minutes: 0
    };
    this.showModal.set(true);
  }

  openEditModal(log: any) {
    this.isEditing.set(true);
    // Create a copy to avoid immediate UI update before saving
    this.newLog = { ...log };
    // Format date for the input field if needed (YYYY-MM-DD)
    if (this.newLog.date) {
      this.newLog.date = new Date(this.newLog.date).toISOString().split('T')[0];
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveLog() {
    if (!this.newLog.project || !this.newLog.branchName || !this.newLog.task || this.newLog.minutes <= 0 || !this.newLog.workStatus) {
      alert('Please fill all fields');
      return;
    }

    if (this.newLog.date > this.maxDate) {
      alert('You cannot log work for a future date!');
      return;
    }
    
    if (this.isEditing()) {
      this.apiService.updateTimesheet(this.newLog._id, this.newLog).subscribe({
        next: (res) => {
          if (res.success) {
            this.fetchLogs();
            this.closeModal();
          }
        },
        error: (err) => alert('Error updating: ' + err.message)
      });
    } else {
      this.apiService.createTimesheet(this.newLog).subscribe({
        next: (res) => {
          if (res.success) {
            this.fetchLogs();
            this.closeModal();
          }
        },
        error: (err) => alert('Error saving: ' + err.message)
      });
    }
  }

  deleteLog(log: any) {
    this.logToDelete.set(log);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const log = this.logToDelete();
    if (log) {
      const recordId = log._id || log;
      this.apiService.deleteTimesheet(recordId).subscribe({
        next: (res) => {
          if (res.success) {
            this.fetchLogs();
            if (this.paginatedLogs().length === 1 && this.currentPage() > 1) {
              this.currentPage.update(p => p - 1);
            }
            this.closeDeleteModal();
          }
        },
        error: (err) => {
          alert('Error deleting: ' + err.message);
          this.closeDeleteModal();
        }
      });
    }
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.logToDelete.set(null);
  }
}
