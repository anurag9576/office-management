import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
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
  private toastService = inject(ToastService);
  
  employees = signal<any[]>([]);
  showModal = signal(false);
  showProfileModal = signal(false);
  selectedEmployeeProfile = signal<any>(null);
  showPassword = signal(false);
  isEditing = signal(false);
  roles = signal<string[]>([]);
  statuses = ['Active', 'On Leave'];
  
  newEmployee = {
    _id: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    designation: '',
    status: 'Active',
    reportingManager: ''
  } as any;

  // Pagination for Active Employees
  currentPageActive = signal(1);
  itemsPerPage = 5;

  activeEmployees = computed(() => {
    return this.employees().filter(e => e.status !== 'Terminated');
  });

  managers = computed(() => {
    // Return employees who can be managers (e.g., Role is Manager, Admin, or HR Manager)
    return this.employees().filter(e => 
      ['Manager', 'Admin', 'HR Manager'].includes(e.role) && e.status === 'Active'
    );
  });

  paginatedActiveEmployees = computed(() => {
    const startIndex = (this.currentPageActive() - 1) * this.itemsPerPage;
    return this.activeEmployees().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalActivePages = computed(() => {
    return Math.ceil(this.activeEmployees().length / this.itemsPerPage) || 1;
  });

  startActiveRange = computed(() => {
    if (this.activeEmployees().length === 0) return 0;
    return (this.currentPageActive() - 1) * this.itemsPerPage + 1;
  });

  endActiveRange = computed(() => {
    return Math.min(this.currentPageActive() * this.itemsPerPage, this.activeEmployees().length);
  });

  // Pagination for Terminated Employees
  currentPageTerminated = signal(1);
  
  terminatedEmployees = computed(() => {
    return this.employees().filter(e => e.status === 'Terminated');
  });

  paginatedTerminatedEmployees = computed(() => {
    const startIndex = (this.currentPageTerminated() - 1) * this.itemsPerPage;
    return this.terminatedEmployees().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalTerminatedPages = computed(() => {
    return Math.ceil(this.terminatedEmployees().length / this.itemsPerPage) || 1;
  });

  startTerminatedRange = computed(() => {
    if (this.terminatedEmployees().length === 0) return 0;
    return (this.currentPageTerminated() - 1) * this.itemsPerPage + 1;
  });

  endTerminatedRange = computed(() => {
    return Math.min(this.currentPageTerminated() * this.itemsPerPage, this.terminatedEmployees().length);
  });

  goToActivePage(page: number) {
    if (page >= 1 && page <= this.totalActivePages()) {
      this.currentPageActive.set(page);
    }
  }

  goToTerminatedPage(page: number) {
    if (page >= 1 && page <= this.totalTerminatedPages()) {
      this.currentPageTerminated.set(page);
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
        this.toastService.show('Failed to load employees.', 'error');
      }
    });
  }

  showAddModal() {
    this.isEditing.set(false);
    
    // Calculate next HHPL ID instantly from local cache
    const hhplIds = this.employees()
      .map(e => e.employeeId)
      .filter(id => id && id.startsWith('HHPL '))
      .map(id => parseInt(id.replace('HHPL ', ''), 10))
      .filter(num => !isNaN(num));
    
    let nextNum = 1;
    if (hhplIds.length > 0) {
      nextNum = Math.max(...hhplIds) + 1;
    }
    const formattedNum = nextNum < 10 ? `0${nextNum}` : nextNum;
    const nextId = `HHPL ${formattedNum}`;

    this.newEmployee = {
      _id: '',
      employeeId: nextId,
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      designation: '',
      status: 'Active',
      reportingManager: ''
    };

    this.showPassword.set(false);
    this.showModal.set(true);
  }

  editEmployee(emp: any) {
    this.isEditing.set(true);
    // Deep clone to avoid direct signal mutation and ensure structure
    this.newEmployee = JSON.parse(JSON.stringify(emp));
    
    // Convert reportingManager object to ID string for the dropdown if it exists
    if (this.newEmployee.reportingManager && typeof this.newEmployee.reportingManager === 'object') {
      this.newEmployee.reportingManager = this.newEmployee.reportingManager._id;
    }
    
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  onStatusChange(newVal: string) {
    this.newEmployee.status = newVal;
  }

  closeModal() {
    this.showModal.set(false);
    this.showProfileModal.set(false);
  }

  viewProfile(emp: any) {
    this.selectedEmployeeProfile.set(emp);
    this.showProfileModal.set(true);
  }


  saveEmployee() {
    const emp = this.newEmployee;
    if (!emp.firstName || !emp.lastName || !emp.email || !emp.role || (!this.isEditing() && !emp.password)) {
      this.toastService.show('Please fill all required fields before saving.', 'error');
      return;
    }

    if (this.isEditing()) {
      this.apiService.updateEmployee(emp._id, emp).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEmployees();
            this.closeModal();
            this.toastService.show('Employee data updated successfully!', 'success');
          }
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Error updating employee', 'error');
        }
      });
    } else {
      this.apiService.register(emp).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadEmployees();
            this.closeModal();
            this.toastService.show('Employee added successfully!', 'success');
          }
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Error adding employee', 'error');
        }
      });
    }
  }

  showDeleteModal = signal(false);
  employeeToDeleteId = signal('');

  deleteModalTitle = computed(() => {
    const id = this.employeeToDeleteId();
    if (!id) return 'Are you sure?';
    const targetEmp = this.employees().find(e => e._id === id);
    return targetEmp && targetEmp.status !== 'Terminated' 
      ? 'Terminate this employee?' 
      : 'Are you sure active this employ?';
  });

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

    const targetEmp = this.employees().find(e => e._id === id);
    if (!targetEmp) return;

    const isTerminated = targetEmp.status === 'Terminated';
    const newStatus = isTerminated ? 'Active' : 'Terminated';

    this.apiService.updateEmployee(id, { ...targetEmp, status: newStatus }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadEmployees();
          this.toastService.show(
            isTerminated ? 'Employee activated successfully!' : 'Employee has been moved to terminated records.', 
            'success'
          );
          this.cancelDelete();
        }
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Error updating status', 'error');
        this.cancelDelete();
      }
    });
  }

  isRestorable(emp: any): boolean {
    if (emp.status !== 'Terminated' || !emp.terminationDate) return true;
    const termDate = new Date(emp.terminationDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return termDate > oneMonthAgo;
  }
}
