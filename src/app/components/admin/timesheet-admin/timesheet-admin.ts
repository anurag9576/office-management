import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-timesheet-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timesheet-admin.html',
  styleUrl: './timesheet-admin.css'
})
export class TimesheetAdmin implements OnInit {
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years = [2024, 2025, 2026];
  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());
  
  allLogs = signal<any[]>([]);
  allEmployees = signal<any[]>([]);
  isLoading = signal(true);
  
  viewMode = signal<'summary' | 'detail'>('summary');
  selectedEmployee = signal<any>(null);
  searchTerm = signal('');

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchData();
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.apiService.getEmployees().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allEmployees.set(res.data);
        }
      },
      error: (err: any) => console.error('Error fetching employees:', err)
    });
  }

  fetchData() {
    this.isLoading.set(true);
    this.apiService.getAllTimesheets().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.allLogs.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Filter logs by month and year
  filteredLogs = computed(() => {
    return this.allLogs().filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === Number(this.selectedMonth()) && d.getFullYear() === Number(this.selectedYear());
    });
  });

  // Unique employees from filtered logs with stats
  employeeStats = computed(() => {
    const logs = this.filteredLogs();
    const statsMap = new Map();

    logs.forEach(log => {
      const empId = log.employeeId?._id || 'unknown';
      const firstName = log.employeeId?.firstName || '';
      const lastName = log.employeeId?.lastName || '';
      const empName = firstName ? `${firstName} ${lastName}`.trim() : 'Unknown Employee';
      const empRole = log.employeeId?.role || 'User';
      
      if (!statsMap.has(empId)) {
        statsMap.set(empId, {
          id: empId,
          name: empName,
          role: empRole,
          totalMinutes: 0,
          logs: [],
          projects: new Set<string>(),
          avatar: empName.split(' ').map((n:any) => n[0]).join('').toUpperCase()
        });
      }

      const stats = statsMap.get(empId);
      stats.totalMinutes += log.minutes || 0;
      stats.logs.push(log);
      if (log.project) stats.projects.add(log.project);
    });

    const allStats = Array.from(statsMap.values()).map(s => ({
      ...s,
      totalHours: (s.totalMinutes / 60).toFixed(1),
      projectList: Array.from(s.projects).join(', ')
    }));

    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return allStats;

    return allStats.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.projectList.toLowerCase().includes(search)
    );
  });

  // Global Stats
  totalMonthlyHours = computed(() => {
    const totalMinutes = this.filteredLogs().reduce((acc, log) => acc + (log.minutes || 0), 0);
    const hours = totalMinutes / 60;
    return hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
  });

  totalMonthlyMinutes = computed(() => {
    return this.filteredLogs().reduce((acc, log) => acc + (log.minutes || 0), 0);
  });

  activeEmployeesCount = computed(() => {
    return this.employeeStats().length;
  });

  totalRegisteredEmployees = computed(() => {
    return this.allEmployees().length;
  });

  viewRecords(emp: any) {
    this.selectedEmployee.set(emp);
    this.viewMode.set('detail');
  }

  backToSummary() {
    this.viewMode.set('summary');
    this.selectedEmployee.set(null);
  }

  exportToCSV() {
    let logs = this.filteredLogs();
    let filename = `Timesheet_Report_${this.months[this.selectedMonth()]}_${this.selectedYear()}.csv`;

    // If in detail view, only export for the selected employee
    const selectedEmp = this.selectedEmployee();
    if (this.viewMode() === 'detail' && selectedEmp) {
      logs = logs.filter(log => (log.employeeId?._id || 'unknown') === selectedEmp.id);
      filename = `${selectedEmp.name.replace(/\s+/g, '_')}_Timesheet_${this.months[this.selectedMonth()]}.csv`;
    }

    // Sort logs by date ascending (oldest first)
    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (logs.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Employee', 'Date', 'Project', 'Task', 'Minutes', 'Status'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        const d = new Date(log.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return [
          `"${log.employeeId ? (log.employeeId.firstName + ' ' + log.employeeId.lastName).trim() : 'N/A'}"`,
          `"${dateStr}"`,
          `"${log.project}"`,
          `"${log.task.replace(/"/g, '""')}"`,
          log.minutes,
          `"${log.workStatus}"`
        ].join(',');
      })
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
