import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class EmployeesMgmt {
  employees = signal([
    { id: 'EMP001', name: 'Anurag Kumar', email: 'anurag@hamsa.com', role: 'Software Developer', designation: 'Senior Developer', dept: 'IT', status: 'Active' },
    { id: 'EMP002', name: 'Sarah Jenkins', email: 'sarah@hamsa.com', role: 'HR Manager', designation: 'HR Head', dept: 'HR', status: 'Active' },
    { id: 'EMP003', name: 'Amit Singh', email: 'amit@hamsa.com', role: 'UI Designer', designation: 'Visual Lead', dept: 'Design', status: 'On Leave' }
  ]);

  showModal = signal(false);
  showPassword = signal(false);
  isEditing = signal(false);
  errorMessage = signal('');
  roles = ['HR Manager', 'QA', 'Developer', 'Manager', 'IT Team'];
  newEmployee = {
    id: '',
    name: '',
    email: '',
    password: '',
    role: '',
    designation: '',
    dept: 'IT'
  };

  showAddModal() {
    this.isEditing.set(false);
    this.errorMessage.set('');
    this.newEmployee = {
      id: 'EMP' + Math.floor(100 + Math.random() * 900),
      name: '',
      email: '',
      password: '',
      role: '',
      designation: '',
      dept: 'IT'
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

  saveEmployee() {
    const emp = this.newEmployee;
    if (!emp.name || !emp.email || !emp.id || !emp.role) {
      this.errorMessage.set('Please fill all required fields before saving.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    if (this.isEditing()) {
      this.employees.update(prev => prev.map(e => e.id === emp.id ? { ...e, ...emp } : e));
    } else {
      this.employees.update(prev => [...prev, {
        ...emp,
        status: 'Active'
      }]);
    }
    
    this.closeModal();
  }

  deleteEmployee(id: string) {
    if (confirm('Are you sure you want to remove this employee?')) {
      this.employees.update(prev => prev.filter(e => e.id !== id));
    }
  }
}
