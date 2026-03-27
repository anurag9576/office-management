import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payroll-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll-admin.html',
  styleUrl: './payroll-admin.css'
})
export class PayrollAdmin implements OnInit {
  private apiService = inject(ApiService);

  payrolls = signal<any[]>([]);
  employees = signal<any[]>([]);
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  paginatedList = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.payrolls().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.payrolls().length / this.itemsPerPage) || 1;
  });

  startRange = computed(() => {
    if (this.payrolls().length === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  });

  endRange = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage, this.payrolls().length);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  // Search & Selection
  searchTerm = signal('');
  selectedEmployeeEmail = signal('');
  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.employees().filter(e => 
      (e.firstName?.toLowerCase() || '').includes(term) || 
      (e.lastName?.toLowerCase() || '').includes(term) || 
      (e.email?.toLowerCase() || '').includes(term)
    );
  });

  // UI States
  showUploadModal = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  editingPayrollId = signal<string | null>(null);
  payrollToDelete = signal<any>(null);

  // Form Data
  payrollForm = signal({
    employeeId: '',
    designation: '',
    departmentName: '',
    month: '',
    year: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    grossAmount: 0,
    period: '',
    daysPresent: 30,
    daysAbsent: 0,
    totalDays: 30,
    pdfUrl: '',
    earnings: [
      { label: 'Basic Salary', actualAmount: 0, amount: 0 },
      { label: 'House Rent Allowance', actualAmount: 0, amount: 0 },
      { label: 'City Compensatory Allowance', actualAmount: 0, amount: 0 },
      { label: 'Conveyance Allowance', actualAmount: 0, amount: 0 },
      { label: 'Medical Allowance', actualAmount: 0, amount: 0 },
      { label: 'Variable Pay', actualAmount: 0, amount: 0 }
    ],
    deductionsList: [
      { label: 'Provident Fund', amount: 0 },
      { label: 'Professional Tax', amount: 200 },
      { label: 'Income Tax', amount: 0 },
      { label: 'Loan and Advance', amount: 0 }
    ]
  });

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files');
        return;
      }
      
      this.isLoading.set(true);
      try {
        const uploadRes = await firstValueFrom(this.apiService.uploadFile(file, 'office-management/payroll'));
        if (uploadRes.success) {
          const secureUrl = uploadRes.data.path || uploadRes.data.url;
          this.payrollForm.update(prev => ({ ...prev, pdfUrl: secureUrl }));
          this.showSuccess('PDF uploaded successfully!');
        }
      } catch (error) {
        console.error('File upload failed:', error);
        this.errorMessage.set('Failed to upload PDF to server.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadAllPayrolls();
  }

  loadEmployees() {
    this.apiService.getEmployees().subscribe({
      next: (res) => this.employees.set(res.data || res),
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadAllPayrolls() {
    this.isLoading.set(true);
    this.apiService.getAllPayrolls().subscribe({
      next: (res) => {
        this.payrolls.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading payrolls:', err);
        this.isLoading.set(false);
      }
    });
  }

  openUploadModal() {
    this.showUploadModal.set(true);
    this.resetForm();
  }

  openEditModal(payroll: any) {
    this.resetForm();
    this.editingPayrollId.set(payroll._id);
    
    // Format date securely to YYYY-MM-DD
    let formattedDate = new Date().toISOString().split('T')[0];
    if (payroll.paymentDate) {
      formattedDate = new Date(payroll.paymentDate).toISOString().split('T')[0];
    }

    this.payrollForm.set({
      employeeId: payroll.employee?._id || payroll.employee,
      designation: payroll.designation || '',
      departmentName: payroll.departmentName || '',
      month: payroll.month || '',
      year: payroll.year || new Date().getFullYear(),
      paymentDate: formattedDate,
      grossAmount: payroll.grossAmount || 0,
      period: payroll.period || '',
      daysPresent: payroll.daysPresent || 30,
      daysAbsent: payroll.daysAbsent || 0,
      totalDays: payroll.totalDays || 30,
      pdfUrl: payroll.pdfUrl || '',
      earnings: payroll.earnings?.length ? [...payroll.earnings] : [],
      deductionsList: payroll.deductionsList?.length ? [...payroll.deductionsList] : []
    });

    if (payroll.employee) {
      this.selectedEmployeeEmail.set(payroll.employee.email || payroll.employee.employeeId || 'selected');
      this.searchTerm.set(`${payroll.employee.firstName} ${payroll.employee.lastName}`);
    }

    this.showUploadModal.set(true);
  }

  resetForm() {
    this.editingPayrollId.set(null);
    this.payrollForm.set({
      employeeId: '',
      designation: '',
      departmentName: '',
      month: '',
      year: new Date().getFullYear(),
      paymentDate: new Date().toISOString().split('T')[0],
      grossAmount: 0,
      period: '',
      daysPresent: 30,
      daysAbsent: 0,
      totalDays: 30,
      pdfUrl: '',
      earnings: [
        { label: 'Basic Salary', actualAmount: 0, amount: 0 },
        { label: 'House Rent Allowance', actualAmount: 0, amount: 0 },
        { label: 'City Compensatory Allowance', actualAmount: 0, amount: 0 },
        { label: 'Conveyance Allowance', actualAmount: 0, amount: 0 },
        { label: 'Medical Allowance', actualAmount: 0, amount: 0 },
        { label: 'Variable Pay', actualAmount: 0, amount: 0 }
      ],
      deductionsList: [
        { label: 'Provident Fund', amount: 0 },
        { label: 'Professional Tax', amount: 200 },
        { label: 'Income Tax', amount: 0 },
        { label: 'Loan and Advance', amount: 0 }
      ]
    });
    this.searchTerm.set('');
    this.selectedEmployeeEmail.set('');
  }

  updateDesignation(val: string) {
    this.payrollForm.update(prev => ({ ...prev, designation: val }));
  }

  updateMonth(val: string) {
    this.payrollForm.update(prev => ({ ...prev, month: val }));
    this.updateAutoPeriod();
  }

  updateYear(val: number) {
    this.payrollForm.update(prev => ({ ...prev, year: val }));
    this.updateAutoPeriod();
  }

  updatePaymentDate(val: string) {
    this.payrollForm.update(prev => ({ ...prev, paymentDate: val }));
  }

  selectEmployee(emp: any) {
    this.payrollForm.update(prev => ({ 
      ...prev, 
      employeeId: emp._id,
      designation: emp.designation || '',
      departmentName: emp.department?.name || '',
      // If employee has a saved salary structure, load it automatically
      earnings: emp.salaryStructure?.earnings?.length > 0 ? [...emp.salaryStructure.earnings] : prev.earnings,
      deductionsList: emp.salaryStructure?.deductionsList?.length > 0 ? [...emp.salaryStructure.deductionsList] : prev.deductionsList,
      grossAmount: emp.salaryStructure?.grossAmount || 0
    }));
    this.selectedEmployeeEmail.set(emp.email);
    this.searchTerm.set(`${emp.firstName} ${emp.lastName}`);
  }

  updateAutoPeriod() {
    const form = this.payrollForm();
    if (!form.month || !form.year) return;

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(form.month);
    if (monthIndex === -1) return;

    const lastDay = new Date(form.year, monthIndex + 1, 0).getDate();
    const periodString = `${form.month} 01 - ${form.month} ${lastDay}, ${form.year}`;
    
    this.payrollForm.update(prev => ({ ...prev, period: periodString }));
  }

  // Row Management
  addEarning() {
    this.payrollForm.update(prev => ({
      ...prev,
      earnings: [...prev.earnings, { label: '', actualAmount: 0, amount: 0 }]
    }));
  }

  removeEarning(index: number) {
    this.payrollForm.update(prev => ({
      ...prev,
      earnings: prev.earnings.filter((_, i) => i !== index)
    }));
  }

  addDeduction() {
    this.payrollForm.update(prev => ({
      ...prev,
      deductionsList: [...prev.deductionsList, { label: '', amount: 0 }]
    }));
  }

  removeDeduction(index: number) {
    this.payrollForm.update(prev => ({
      ...prev,
      deductionsList: prev.deductionsList.filter((_, i) => i !== index)
    }));
  }

  submitPayroll() {
    const data = { ...this.payrollForm() };
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();

    if (!data.month) data.month = 'February';
    if (!data.year) data.year = now.getFullYear();
    
    if (!data.employeeId) {
      alert('Please select an employee');
      return;
    }

    this.isLoading.set(true);

    const isEdit = !!this.editingPayrollId();
    const request$ = isEdit 
      ? this.apiService.updatePayroll(this.editingPayrollId()!, data)
      : this.apiService.generatePayroll(data);

    request$.subscribe({
      next: (res) => {
        this.showSuccess(`Salary Master ${isEdit ? 'updated' : 'generated'} successfully!`);
        this.showUploadModal.set(false);
        this.loadAllPayrolls();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || `Failed to ${isEdit ? 'update' : 'generate'} salary master`);
        this.isLoading.set(false);
      }
    });
  }

  promptDelete(payroll: any) {
    this.payrollToDelete.set(payroll);
  }

  cancelDelete() {
    this.payrollToDelete.set(null);
  }

  confirmDelete() {
    const payroll = this.payrollToDelete();
    if (!payroll) return;
    
    this.isLoading.set(true);
    this.apiService.deletePayroll(payroll._id).subscribe({
      next: () => {
        this.showSuccess('Payroll record deleted successfully!');
        this.payrollToDelete.set(null);
        this.loadAllPayrolls();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete payroll record');
        this.isLoading.set(false);
      }
    });
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  formatCurrency(amount: number): string {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  }

  calculateNet() {
    const form = this.payrollForm();
    const earningsTotal = form.earnings.reduce((acc, curr) => acc + curr.amount, 0);
    const deductionsTotal = form.deductionsList.reduce((acc, curr) => acc + curr.amount, 0);
    return earningsTotal - deductionsTotal;
  }
}
