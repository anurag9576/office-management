import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  roles = ['HR Manager', 'QA', 'Developer', 'Manager', 'IT Team'];
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

  ngOnInit() {
    this.loadEmployees();
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
