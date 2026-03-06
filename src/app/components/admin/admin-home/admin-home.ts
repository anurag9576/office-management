import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css'
})
export class AdminHome {
  stats = signal([
    { label: 'Total Employees', value: '154', icon: 'group', color: 'bg-brand-1', trend: '+12% this month' },
    { label: 'Present Today', value: '142', icon: 'how_to_reg', color: 'bg-emerald-500', trend: '92% Attendance' },
    { label: 'Pending Leaves', value: '8', icon: 'event_busy', color: 'bg-brand-5', trend: 'Needs Action' },
    { label: 'Active Projects', value: '24', icon: 'rocket_launch', color: 'bg-brand-1', trend: 'Across 4 Depts' }
  ]);

  recentActions = signal([
    { admin: 'Admin User', action: 'Approved Leave for Anurag', time: '10 mins ago' },
    { admin: 'Admin User', action: 'Added New Member: Sarah Jenkins', time: '45 mins ago' },
    { admin: 'Admin User', action: 'Updated Payroll for March', time: '2 hours ago' }
  ]);
}
