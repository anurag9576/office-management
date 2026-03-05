import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class Payroll {
  // Available Paystubs
  paystubs = signal([
    { 
      month: 'March 2026', 
      date: 'Mar 31, 2026', 
      amount: '₹84,500', 
      gross: '₹1,05,000', 
      deductions: '₹20,500',
      period: 'March 1 - March 31, 2026',
      status: 'Scheduled',
      earnings: [
        { label: 'Basic Salary', amount: '₹45,000' },
        { label: 'HRA', amount: '₹22,500' },
        { label: 'Allowances', amount: '₹17,000' }
      ],
      deductionsList: [
        { label: 'Provident Fund', amount: '₹0.00' },
        { label: 'Professional Tax', amount: '₹200.00' },
        { label: 'Income Tax', amount: '₹0.00' },
        { label: 'Loan and Advance', amount: '₹0.00' }
      ]
    },
    { 
      month: 'February 2026', 
      date: 'Feb 28, 2026', 
      amount: '₹84,500', 
      gross: '₹1,05,000', 
      deductions: '₹20,500',
      period: 'February 1 - February 28, 2026',
      status: 'Paid',
      earnings: [
        { label: 'Basic Salary', amount: '₹45,000' },
        { label: 'HRA', amount: '₹22,500' },
        { label: 'Allowances', amount: '₹17,000' }
      ],
      deductionsList: [
        { label: 'Provident Fund', amount: '₹0.00' },
        { label: 'Professional Tax', amount: '₹200.00' },
        { label: 'Income Tax', amount: '₹0.00' },
        { label: 'Loan and Advance', amount: '₹0.00' }
      ]
    },
    { 
      month: 'January 2026', 
      date: 'Jan 31, 2026', 
      amount: '₹84,500', 
      gross: '₹1,05,000', 
      deductions: '₹20,500',
      period: 'January 1 - January 31, 2026',
      status: 'Paid',
      earnings: [
        { label: 'Basic Salary', amount: '₹45,000' },
        { label: 'HRA', amount: '₹22,500' },
        { label: 'Allowances', amount: '₹17,000' }
      ],
      deductionsList: [
        { label: 'Provident Fund', amount: '₹0.00' },
        { label: 'Professional Tax', amount: '₹200.00' },
        { label: 'Income Tax', amount: '₹0.00' },
        { label: 'Loan and Advance', amount: '₹0.00' }
      ]
    },
    { 
      month: 'December 2025', 
      date: 'Dec 31, 2025', 
      amount: '₹82,000', 
      gross: '₹1,00,000', 
      deductions: '₹18,000',
      period: 'December 1 - December 31, 2025',
      status: 'Paid',
      earnings: [
        { label: 'Basic Salary', amount: '₹43,000' },
        { label: 'HRA', amount: '₹21,500' },
        { label: 'Allowances', amount: '₹17,500' }
      ],
      deductionsList: [
        { label: 'Provident Fund', amount: '₹0.00' },
        { label: 'Professional Tax', amount: '₹200.00' },
        { label: 'Income Tax', amount: '₹0.00' },
        { label: 'Loan and Advance', amount: '₹0.00' }
      ]
    }
  ]);

  selectedMonthIndex = signal(0);
  filterValue = signal(new Date().toISOString().slice(0, 7));
  isFilterActive = signal(false);

  filteredPaystubs = computed(() => {
    if (!this.isFilterActive()) return this.paystubs();
    
    const filter = this.filterValue();
    if (!filter) return this.paystubs();
    
    // Format filter: '2026-03' -> needs to match month string in data
    const [year, monthNum] = filter.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(monthNum) - 1];
    const filterStr = `${monthName} ${year}`;

    return this.paystubs().filter(stub => stub.month.includes(filterStr));
  });

  selectedStub = computed(() => {
    const filtered = this.filteredPaystubs();
    return filtered.length > 0 ? filtered[this.selectedMonthIndex()] : null;
  });

  onFilterChange(event: any) {
    this.filterValue.set(event.target.value);
    this.isFilterActive.set(true);
    this.selectedMonthIndex.set(0); // Reset selection to first item in filtered list
  }

  selectMonth(index: number) {
    this.selectedMonthIndex.set(index);
  }

  downloadPayslip() {
    const stub = this.selectedStub();
    if (!stub) return;
    console.log(`Downloading payslip for ${stub.month}...`);
    alert(`Downloading Payslip for ${stub.month}`);
  }
}
