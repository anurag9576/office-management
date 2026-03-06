import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class AttendanceMgmt {
  attendanceRecords = signal([
    { name: 'Anurag Kumar', date: '06 Mar 2025', checkIn: '09:00 AM', checkOut: '06:00 PM', status: 'Present' },
    { name: 'Sarah Jenkins', date: '06 Mar 2025', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present' },
    { name: 'Amit Singh', date: '06 Mar 2025', checkIn: '-', checkOut: '-', status: 'Absent' }
  ]);
}
