import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
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
  private toastService = inject(ToastService);

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
  showUploadModal = false;
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  editingPayrollId = signal<string | null>(null);
  payrollToDelete = signal<any>(null);

  // Form Data
  payrollForm = signal({
    employeeId: '',
    designation: '',
    departmentName: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    paymentDate: new Date().toISOString().split('T')[0],
    grossAmount: 0,
    period: '',
    daysPresent: 30,
    daysAbsent: 0,
    totalDays: 30,
    pdfUrl: '',
    isAutoGenerate: true,
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
    // Now loading from Salary Master table
    this.apiService.getSalaryMasters().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.payrolls.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading salary masters:', err);
        this.isLoading.set(false);
      }
    });
  }

  openUploadModal() {
    this.showUploadModal = true;
    this.resetForm();
  }

  openEditModal(master: any) {
    this.resetForm();
    this.editingPayrollId.set(master._id);
    
    this.payrollForm.set({
      employeeId: master.employee?._id || master.employee,
      designation: master.designation || master.employee?.designation || '',
      departmentName: master.departmentName || '',
      month: '', // Not needed for Master
      year: new Date().getFullYear(), // Not needed for Master
      paymentDate: '', // Not needed for Master
      grossAmount: master.grossAmount || 0,
      period: '',
      daysPresent: 30,
      daysAbsent: 0,
      totalDays: 30,
      pdfUrl: '',
      isAutoGenerate: master.isAutoGenerate !== false,
      earnings: master.earnings?.length ? [...master.earnings] : [],
      deductionsList: master.deductionsList?.length ? [...master.deductionsList] : []
    });

    if (master.employee) {
      this.selectedEmployeeEmail.set(master.employee.email || 'selected');
      this.searchTerm.set(`${master.employee.firstName} ${master.employee.lastName}`);
    }

    this.showUploadModal = true;
  }

  resetForm() {
    this.editingPayrollId.set(null);
    this.payrollForm.set({
      employeeId: '',
      designation: '',
      departmentName: '',
      month: '',
      year: new Date().getFullYear(),
      paymentDate: '',
      grossAmount: 0,
      period: '',
      daysPresent: 30,
      daysAbsent: 0,
      totalDays: 30,
      pdfUrl: '',
      isAutoGenerate: true,
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

  // Monthly methods kept for compatibility but not used in master form
  updateMonth(val: string) {}
  updateYear(val: number) {}
  updatePaymentDate(val: string) {}

  selectEmployee(emp: any) {
    this.payrollForm.update(prev => ({ 
      ...prev, 
      employeeId: emp._id,
      designation: emp.designation || '',
      departmentName: emp.department?.name || '',
      earnings: emp.salaryStructure?.earnings?.length > 0 ? [...emp.salaryStructure.earnings] : prev.earnings,
      deductionsList: emp.salaryStructure?.deductionsList?.length > 0 ? [...emp.salaryStructure.deductionsList] : prev.deductionsList,
      grossAmount: emp.salaryStructure?.grossAmount || 0,
      isAutoGenerate: emp.salaryStructure?.isAutoGenerate !== undefined ? emp.salaryStructure.isAutoGenerate : true
    }));
    this.selectedEmployeeEmail.set(emp.email);
    this.searchTerm.set(`${emp.firstName} ${emp.lastName}`);
  }

  updateAutoPeriod() {}

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

  async submitPayroll() {
    const data = { ...this.payrollForm() };
    
    if (!data.employeeId) {
      this.toastService.show('Please select an employee', 'error');
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Create or Update Salary Master
      await firstValueFrom(this.apiService.saveSalaryMaster(data));
      
      this.showUploadModal = false;
      this.editingPayrollId.set(null);
      this.isSubmitting.set(false);
      this.showSuccess(`Salary Master configuration saved successfully!`);

      setTimeout(() => {
        this.loadAllPayrolls();
      }, 500);
    } catch (err: any) {
      this.isSubmitting.set(false);
      this.errorMessage.set(err.error?.message || 'Failed to save salary configuration');
    }
  }

  promptDelete(payroll: any) {
    this.payrollToDelete.set(payroll);
  }

  cancelDelete() {
    this.payrollToDelete.set(null);
  }

  confirmDelete() {
    const master = this.payrollToDelete();
    if (!master) return;
    
    this.isLoading.set(true);
    this.apiService.deleteSalaryMaster(master._id).subscribe({
      next: () => {
        this.showSuccess('Salary Master configuration removed!');
        this.payrollToDelete.set(null);
        this.loadAllPayrolls();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to remove salary configuration');
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
