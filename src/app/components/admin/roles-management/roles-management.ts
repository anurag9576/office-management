import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-roles-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-management.html',
  styleUrl: './roles-management.css'
})
export class RolesMgmt {
  roles = signal([
    { user: 'S', role: 'HR Manager', permissions: ['Employee Management', 'Leave Approvals'] },
    { user: 'V', role: 'Operations Lead', permissions: ['Attendance Logs', 'Task Distribution'] }
  ]);

  permissionOptions = [
    'Employee Management',
    'Department Analytics',
    'Attendance Logs',
    'Leave Approvals',
    'Payroll Disbursement',
    'Task Distribution',
    'System Reports',
    'Audit Logs'
  ];

  newRoleName = signal('');
  selectedPermissions = signal<string[]>([]);
  editingIndex = signal<number | null>(null);

  togglePermission(perm: string) {
    const current = this.selectedPermissions();
    if (current.includes(perm)) {
      this.selectedPermissions.set(current.filter((p: string) => p !== perm));
    } else {
      this.selectedPermissions.set([...current, perm]);
    }
  }

  editRole(index: number) {
    const role = this.roles()[index];
    this.newRoleName.set(role.role);
    this.selectedPermissions.set([...role.permissions]);
    this.editingIndex.set(index);
    
    // Scroll to form for better UX
    window.scrollTo({ top: 500, behavior: 'smooth' });
  }

  createRole() {
    if (!this.newRoleName().trim() || this.selectedPermissions().length === 0) return;

    const currentRoles = [...this.roles()];
    const roleData = {
      user: this.newRoleName().charAt(0).toUpperCase(),
      role: this.newRoleName(),
      permissions: [...this.selectedPermissions()]
    };

    if (this.editingIndex() !== null) {
      currentRoles[this.editingIndex()!] = roleData;
    } else {
      currentRoles.push(roleData);
    }

    this.roles.set(currentRoles);
    
    // Reset form
    this.cancelEdit();
  }

  cancelEdit() {
    this.newRoleName.set('');
    this.selectedPermissions.set([]);
    this.editingIndex.set(null);
  }
}
