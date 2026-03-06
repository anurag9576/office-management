import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './departments.html',
  styleUrl: './departments.css'
})
export class DepartmentsMgmt {
  departments = signal([
    { name: 'IT Department', head: 'Rajesh Gupta', count: 12 },
    { name: 'HR Department', head: 'Sarah Jenkins', count: 4 },
    { name: 'Finance', head: 'Amitabh Sen', count: 6 },
    { name: 'Operations', head: 'Vikas Roy', count: 25 }
  ]);
}
