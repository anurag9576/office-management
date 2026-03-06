import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll-admin.html',
  styleUrl: './payroll-admin.css'
})
export class PayrollAdmin {
  payrolls = signal([
    { name: 'Anurag Kumar', base: 85000, bonus: 5000, total: 90000, status: 'Paid' },
    { name: 'Sarah Jenkins', base: 95000, bonus: 10000, total: 105000, status: 'Pending' },
    { name: 'Amit Singh', base: 75000, bonus: 2000, total: 77000, status: 'Pending' },
    { name: 'Priya Sharma', base: 65000, bonus: 0, total: 65000, status: 'Paid' }
  ]);

  showModal = signal(false);
  isProcessing = signal(false);
  processSuccess = signal(false);

  stats = computed(() => {
    const list = this.payrolls();
    const pending = list.filter(p => p.status === 'Pending');
    return {
      pendingCount: pending.length,
      totalAmount: pending.reduce((acc, curr) => acc + curr.total, 0),
      totalBase: pending.reduce((acc, curr) => acc + curr.base, 0),
      totalBonus: pending.reduce((acc, curr) => acc + curr.bonus, 0)
    };
  });

  openProcessModal() {
    if (this.stats().pendingCount === 0) {
      alert('No pending salaries to process for this month!');
      return;
    }
    this.showModal.set(true);
    this.processSuccess.set(false);
  }

  closeModal() {
    if (!this.isProcessing()) {
      this.showModal.set(false);
    }
  }

  confirmDisbursement() {
    this.isProcessing.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.payrolls.update(list => list.map(p => ({ ...p, status: 'Paid' })));
      this.isProcessing.set(false);
      this.processSuccess.set(true);
      
      // Auto close after success
      setTimeout(() => this.closeModal(), 2000);
    }, 2000);
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }
}
