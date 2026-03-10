import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payroll.html',
  styleUrl: './payroll.css',
})
export class Payroll implements OnInit {
  private apiService = inject(ApiService);
  
  // Available Paystubs
  paystubs = signal<any[]>([]);

  isLoading = signal(false);
  selectedMonthIndex = signal(0);
  filterValue = signal(new Date().toISOString().slice(0, 7));
  isFilterActive = signal(false);

  ngOnInit() {
    this.loadPayrolls();
  }

  loadPayrolls() {
    this.isLoading.set(true);
    this.apiService.getMyPayrolls().subscribe({
      next: (res) => {
        if (res.success) {
          const formattedData = res.data.map((p: any) => {
            const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date();
            return {
              ...p,
              month: p.month || paymentDate.toLocaleString('default', { month: 'long' }),
              year: p.year || paymentDate.getFullYear(),
              period: p.period || `${paymentDate.toLocaleString('default', { month: 'long' })} ${paymentDate.getFullYear()}`,
              status: p.status || 'Paid',
              date: paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              amount: `₹${(p.netAmount || 0).toLocaleString()}`,
              gross: `₹${(p.grossAmount || 0).toLocaleString()}`,
              deductions: `₹${(p.totalDeductions || 0).toLocaleString()}`,
              earnings: p.earnings ? p.earnings.map((e: any) => ({ label: e.label, amount: `₹${(e.amount || 0).toLocaleString()}` })) : [],
              deductionsList: p.deductionsList ? p.deductionsList.map((d: any) => ({ label: d.label, amount: `₹${(d.amount || 0).toLocaleString()}` })) : []
            };
          });
          this.paystubs.set(formattedData);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching payroll:', err);
        this.isLoading.set(false);
      }
    });
  }

  filteredPaystubs = computed(() => {
    if (!this.isFilterActive()) return this.paystubs();
    
    const filter = this.filterValue();
    if (!filter) return this.paystubs();
    
    const [year, monthNum] = filter.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(monthNum) - 1];
    
    return this.paystubs().filter(stub => 
      stub.month.includes(monthName) && stub.year.toString().includes(year)
    );
  });

  selectedStub = computed(() => {
    const filtered = this.filteredPaystubs();
    return filtered.length > 0 ? filtered[this.selectedMonthIndex()] : null;
  });

  onFilterChange(event: any) {
    this.filterValue.set(event.target.value);
    this.isFilterActive.set(true);
    this.selectedMonthIndex.set(0); 
  }

  selectMonth(index: number) {
    this.selectedMonthIndex.set(index);
  }

  downloadPayslip() {
    const stub = this.selectedStub();
    if (!stub) return;

    // If a PDF was uploaded by Admin, download that instead of generating
    if (stub.pdfUrl) {
      alert("Downloading your original salary slip...");
      const link = document.createElement('a');
      link.href = stub.pdfUrl;
      link.download = `Payslip_${stub.month.replace(' ', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    alert("Generating your salary slip... Please wait.");
    console.log(`🚀 Starting generation for: ${stub.month}`);

    const doc = new jsPDF();
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : {};

    // 1. Header & Company Branding
    doc.setFillColor(31, 41, 55); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('HAMSA OFFICE MANAGEMENT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Monthly Salary Statement', 105, 30, { align: 'center' });

    // 2. Employee & Payslip Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`PAYSLIP: ${stub.month.toUpperCase()}`, 15, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Employee Name:', 15, 65);
    doc.text('Employee ID:', 15, 72);
    doc.text('Department:', 15, 79);
    doc.text('Payment Date:', 15, 86);

    doc.setTextColor(0, 0, 0);
    doc.text(`${user.firstName} ${user.lastName}`, 50, 65);
    doc.text(`${user.employeeId || 'N/A'}`, 50, 72);
    doc.text(`${stub.department || 'General'}`, 50, 79);
    doc.text(`${stub.date}`, 50, 86);

    doc.setTextColor(100, 100, 100);
    doc.text('Statement Period:', 120, 65);
    doc.text('Status:', 120, 72);
    doc.setTextColor(0, 0, 0);
    doc.text(`${stub.period}`, 155, 65);
    doc.text(`${stub.status}`, 155, 72);

    // 3. Earnings & Deductions Tables
    const replaceRupee = (val: string) => val ? val.replace('₹', 'Rs. ') : val;
    
    const earningsBody = stub.earnings.map((e: any) => [e.label, replaceRupee(e.amount)]);
    const deductionsBody = stub.deductionsList.map((d: any) => [d.label, replaceRupee(d.amount)]);

    // Earnings Table
    autoTable(doc, {
      startY: 100,
      head: [['Earnings Description', 'Amount']],
      body: [
        ['Gross Salary', replaceRupee(stub.gross)],
        ...earningsBody
      ],
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] }, 
      margin: { left: 15, right: 110 }
    });

    // Deductions Table
    autoTable(doc, {
      startY: 100,
      head: [['Deductions Description', 'Amount']],
      body: [
        ['Total Deductions', `- ${replaceRupee(stub.deductions)}`],
        ...deductionsBody
      ],
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] }, 
      margin: { left: 110, right: 15 }
    });

    // 4. Summary & Net Amount
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, finalY, 195, finalY);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAYABLE:', 15, finalY + 15);
    doc.setTextColor(5, 150, 105);
    doc.text(`${replaceRupee(stub.amount)}`, 60, finalY + 15);

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('* This is a computer-generated document and does not require a physical signature.', 105, finalY + 30, { align: 'center' });

    // 5. Save the PDF
    doc.save(`Payslip_${stub.month.replace(' ', '_')}.pdf`);
  }
}
