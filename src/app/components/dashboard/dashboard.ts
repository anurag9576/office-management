import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../shared/sidebar/sidebar';
import { Navbar } from '../shared/navbar/navbar';
import { ChangePasswordModal } from '../shared/change-password-modal/change-password-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, Navbar, ChangePasswordModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  showChangePasswordModal = signal(false);

  constructor() {
    this.checkPasswordStatus();
  }

  checkPasswordStatus() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const role = (user.role || '').toLowerCase();
    
    // Don't show for admin role
    if (user && role !== 'admin' && !user.passwordChanged) {
      this.showChangePasswordModal.set(true);
    }
  }

  onPasswordChanged() {
    this.showChangePasswordModal.set(false);
  }
}
