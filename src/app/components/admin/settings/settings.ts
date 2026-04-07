import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsAdmin {
  config = signal({
    companyName: 'Hamsa Hitech',
    tagline: 'Passion for discover possibilities',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    maintenanceMode: false,
    emailNotifications: true,
    pushNotifications: false,
    slackIntegration: true,
    twoFactorAuth: false,
    sessionTimeout: 60, // in minutes
  });

  isSaving = signal(false);

  saveSettings() {
    this.isSaving.set(true);
    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      alert('System configuration updated successfully!');
    }, 1500);
  }

  resetDefaults() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.config.set({
        companyName: 'Hamsa Hitech',
        tagline: 'Passion for discover possibilities',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        maintenanceMode: false,
        emailNotifications: true,
        pushNotifications: false,
        slackIntegration: false,
        twoFactorAuth: false,
        sessionTimeout: 30,
      });
    }
  }
}
