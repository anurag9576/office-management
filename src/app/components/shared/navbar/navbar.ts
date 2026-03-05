import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  currentTime = new Date();
  showSettingsDropdown = signal(false);
  showNotificationsDropdown = signal(false);

  notifications = [
    {
      id: 1,
      title: 'New Leave Request',
      message: 'Anurag has applied for sick leave.',
      time: '2 mins ago',
      type: 'request',
      icon: 'event_busy',
      color: 'text-amber-500 bg-amber-50'
    },
    {
      id: 2,
      title: 'Payroll Processed',
      message: 'February payroll is ready for review.',
      time: '1 hour ago',
      type: 'system',
      icon: 'payments',
      color: 'text-green-500 bg-green-50'
    },
    {
      id: 3,
      title: 'Announcement',
      message: 'New office policy update for 2026.',
      time: '5 hours ago',
      type: 'info',
      icon: 'campaign',
      color: 'text-blue-500 bg-blue-50'
    }
  ];

  constructor(private router: Router) {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  toggleSettings() {
    this.showNotificationsDropdown.set(false);
    this.showSettingsDropdown.set(!this.showSettingsDropdown());
  }

  toggleNotifications() {
    this.showSettingsDropdown.set(false);
    this.showNotificationsDropdown.set(!this.showNotificationsDropdown());
  }

  navigateToForgot() {
    this.showSettingsDropdown.set(false);
    this.router.navigate(['/forgot-password']);
  }
}
