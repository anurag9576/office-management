import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './departments.html',
  styleUrl: './departments.css'
})
export class DepartmentsMgmt implements OnInit {
  private apiService = inject(ApiService);
  departments = signal<any[]>([]);

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.apiService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) {
          this.departments.set(res.data);
        }
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }
}
