import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-roles-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-management.html',
  styleUrl: './roles-management.css'
})
export class RolesMgmt {
  roles = signal<any[]>([]);

  permissionOptions = [
    { label: 'Dashboard Access', key: 'dashboard' },
    { label: 'Employee Mgmt', key: 'employees' },
    { label: 'Roles Mgmt', key: 'roles' },

    { label: 'Leave Approvals', key: 'leaves-admin' },
    { label: 'Payroll Admin', key: 'payroll-admin' },
    { label: 'Task Distribution', key: 'tasks' },
    { label: 'System Reports', key: 'reports' },
    { label: 'Announcements', key: 'announcement' },
    { label: 'System Settings', key: 'settings' },
    { label: 'Timesheet Log', key: 'timesheet' },
    { label: 'Timesheet Admin', key: 'timesheet-admin' },
    { label: 'Documents Mgmt', key: 'documents' },
    { label: 'Employee Profile', key: 'profile' },
    { label: 'Apply Leaves', key: 'leaves' },
    { label: 'View Payroll', key: 'payroll' },
    { label: 'Help Center', key: 'help' }
  ];

  newRoleName = signal('');
  selectedPermissions = signal<string[]>([]);
  editingRole: any = null;
  isLoading = signal(false);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading.set(true);
    this.apiService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading roles:', err);
        this.isLoading.set(false);
      }
    });
  }

  getPermissionLabel(key: string) {
    return this.permissionOptions.find(o => o.key === key)?.label || key;
  }

  togglePermission(key: string) {
    const current = this.selectedPermissions();
    if (current.includes(key)) {
      this.selectedPermissions.set(current.filter((p: string) => p !== key));
    } else {
      this.selectedPermissions.set([...current, key]);
    }
  }

  editRole(role: any) {
    this.newRoleName.set(role.name);
    this.selectedPermissions.set([...role.permissions]);
    this.editingRole = role;
    
    // Scroll to form
    window.scrollTo({ top: 500, behavior: 'smooth' });
  }

  saveRole() {
    if (!this.newRoleName().trim() || this.selectedPermissions().length === 0) return;

    this.isLoading.set(true);
    const roleData: any = {
      name: this.newRoleName(),
      permissions: [...this.selectedPermissions()],
      description: `Role for ${this.newRoleName()}`
    };

    if (this.editingRole) {
      roleData.id = this.editingRole._id;
    }

    this.apiService.upsertRole(roleData).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadRoles();
          this.cancelEdit();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error saving role:', err);
        this.isLoading.set(false);
        alert('Failed to save role. Please check if you have Admin permissions.');
      }
    });
  }

  deleteRole(role: any) {
    if (role.name === 'Admin' || role.name === 'Employee') {
      alert('System roles (Admin & Employee) cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return;

    this.isLoading.set(true);
    this.apiService.deleteRole(role._id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadRoles();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error deleting role:', err);
        this.isLoading.set(false);
        alert(err.error?.message || 'Failed to delete role.');
      }
    });
  }

  cancelEdit() {
    this.newRoleName.set('');
    this.selectedPermissions.set([]);
    this.editingRole = null;
  }
}
