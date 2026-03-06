import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports {
  reportTypes = signal([
    { name: 'Monthly Attendance', icon: 'event_note', color: 'bg-blue-500' },
    { name: 'Salary Disbursement', icon: 'payments', color: 'bg-emerald-500' },
    { name: 'Leave Statistics', icon: 'vacation', color: 'bg-purple-500' },
    { name: 'Performance Review', icon: 'assessment', color: 'bg-amber-500' }
  ]);
}
