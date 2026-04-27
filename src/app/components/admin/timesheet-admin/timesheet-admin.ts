import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-timesheet-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
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

  async exportToCSV() {
    let logs = this.filteredLogs();

    // Sort logs by date ascending (oldest first)
    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (logs.length === 0) {
      alert('No data to export');
      return;
    }

    const selectedEmp = this.selectedEmployee();
    let filename = `Timesheet_Report_${this.months[this.selectedMonth()]}_${this.selectedYear()}.xlsx`;

    if (this.viewMode() === 'detail' && selectedEmp) {
      logs = logs.filter(log => (log.employeeId?._id || 'unknown') === selectedEmp.id);
      filename = `${selectedEmp.name.replace(/\s+/g, '_')}_Timesheet_${this.months[this.selectedMonth()]}.xlsx`;
    }

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new (ExcelJS as any).Workbook();
      
      const sheetName = (this.viewMode() === 'detail' && selectedEmp) 
        ? selectedEmp.name.substring(0, 31) 
        : 'Timesheet';
      const worksheet = workbook.addWorksheet(sheetName);

      // Define columns
      const headers = ['DATE', 'DETAILS', 'PORTAL', 'TIME (MINS)', 'Activity', 'Group'];
      worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' } // Blue background
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' }, // White text
          size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 25;

      // Add Data Rows
      let lastDate = '';
      logs.forEach(log => {
        const d = new Date(log.date);
        const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        
        let displayDate = dateStr;
        if (dateStr === lastDate) {
          displayDate = '';
        } else {
          lastDate = dateStr;
        }

        const row = worksheet.addRow({
          'DATE': displayDate,
          'DETAILS': log.task || '',
          'PORTAL': log.project || '',
          'TIME (MINS)': log.minutes,
          'Activity': log.workStatus || '',
          'Group': ''
        });

        // Style each cell in the row
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle' };
          if (cell.address.startsWith('D')) { // TIME (MINS) column
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please check console for details.');
    }
  }

  async downloadAllToExcel() {
    const stats = this.employeeStats();
    if (stats.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const workbook = new (ExcelJS as any).Workbook();
      const filename = `Detailed_Bulk_Reports_${this.months[this.selectedMonth()]}_${this.selectedYear()}.xlsx`;

      for (const emp of stats) {
        const sheetName = emp.name.substring(0, 31).replace(/[\[\]\?\*\/\\:]/g, ''); 
        const worksheet = workbook.addWorksheet(sheetName);
        
        const headers = ['DATE', 'DETAILS', 'PORTAL', 'TIME (MINS)', 'Activity', 'Group'];
        worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: any) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        headerRow.height = 25;

        let lastDate = '';
        const logs = [...emp.logs];
        logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        logs.forEach(log => {
          const d = new Date(log.date);
          const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
          let displayDate = (dateStr === lastDate) ? '' : dateStr;
          lastDate = dateStr;

          const row = worksheet.addRow({
            'DATE': displayDate,
            'DETAILS': log.task || '',
            'PORTAL': log.project || '',
            'TIME (MINS)': log.minutes,
            'Activity': log.workStatus || '',
            'Group': ''
          });

          row.eachCell((cell: any) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { vertical: 'middle' };
          });
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Bulk Excel Error:', error);
      alert('Error generating bulk report.');
    }
  }
}
