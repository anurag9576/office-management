import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class TaskMgmt {
  tasks = signal([
    { title: 'Update Payroll Data', assignedTo: 'Sarah', priority: 'High', status: 'In Progress' },
    { title: 'Employee Onboarding', assignedTo: 'Rajesh', priority: 'Medium', status: 'Pending' }
  ]);
}
