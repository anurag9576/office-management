import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsAdmin {
  config = signal({
    companyName: 'Hamsa Hitech',
    timezone: 'Asia/Kolkata',
    notifications: true
  });
}
