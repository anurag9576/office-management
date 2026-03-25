import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class EmployeesMgmt implements OnInit {
  private apiService = inject(ApiService);
  
  employees = signal<any[]>([]);
  showModal = signal(false);
  showPassword = signal(false);
  isEditing = signal(false);
  errorMessage = signal('');
  roles = signal<string[]>([]);
  statuses = ['Active', 'On Leave', 'Terminated'];
  
  newEmployee = {
    _id: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    designation: '',
    status: 'Active'
  };

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  paginatedEmployees = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.employees().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.employees().length / this.itemsPerPage) || 1;
  });

  startRange = computed(() => {
    if (this.employees().length === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  });

  endRange = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage, this.employees().length);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadRoles();
  }

  loadRoles() {
    this.apiService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          // Extract only the names from the role objects
          const roleNames = res.data.map((r: any) => r.name);
          this.roles.set(roleNames);
        }
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }

  loadEmployees() {
    this.apiService.getEmployees().subscribe({
      next: (res) => {
        if (res.success) {
          this.employees.set(res.data);
        }
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.errorMessage.set('Failed to load employees.');
      }
    });
  }

  showAddModal() {
    this.isEditing.set(false);
    this.errorMessage.set('');
    this.newEmployee = {
      _id: '',
      employeeId: 'EMP' + Math.floor(100 + Math.random() * 900),
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      designation: '',
      status: 'Active'
    };
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  editEmployee(emp: any) {
    this.isEditing.set(true);
    this.errorMessage.set('');
    this.newEmployee = { ...emp };
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  successMessage = signal('');

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 1000);
  }

  saveEmployee() {
    const emp = this.newEmployee;
    if (!emp.firstName || !emp.lastName || !emp.email || !emp.employeeId || !emp.role || (!this.isEditing() && !emp.password)) {
      this.errorMessage.set('Please fill all required fields before saving.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    if (this.isEditing()) {
      this.apiService.updateEmployee(emp._id, emp).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEmployees();
            this.closeModal();
            this.showSuccess('Employee data updated successfully!');
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error updating employee');
        }
      });
    } else {
      this.apiService.register(emp).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEmployees();
            this.closeModal();
            this.showSuccess('Successfull add employee!');
          }
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error adding employee');
        }
      });
    }
  }

  showDeleteModal = signal(false);
  employeeToDeleteId = signal('');

  showDeleteConfirm(id: string) {
    this.employeeToDeleteId.set(id);
    this.showDeleteModal.set(true);
  }

  cancelDelete() {
    this.showDeleteModal.set(false);
    this.employeeToDeleteId.set('');
  }

  confirmDelete() {
    const id = this.employeeToDeleteId();
    if (!id) return;

    this.apiService.deleteEmployee(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadEmployees();
          if (this.paginatedEmployees().length === 1 && this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
          }
          this.cancelDelete();
        }
      },
      error: (err) => {
        alert('Failed to delete employee');
        this.cancelDelete();
      }
    });
  }

  deleteEmployee(id: string) {
    // This method is now handled via showDeleteConfirm
  }
}
