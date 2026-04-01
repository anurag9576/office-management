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
  
  currentUser = signal<any>(null);
  
  // Available Paystubs
  paystubs = signal<any[]>([]);
  
  isLoading = signal(false);
  selectedMonthIndex = signal(0);
  filterValue = signal(new Date().toISOString().slice(0, 7));
  isFilterActive = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  ngOnInit() {
    this.loadUserInfo();
    this.loadPayrolls();
  }

  loadUserInfo() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const userId = user._id || user.id;

    if (userId) {
      this.apiService.getEmployeeById(userId).subscribe({
        next: (res) => {
          const data = res.data || res;
          const formattedUser = {
            ...data,
            name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.name || data.firstName || 'User'),
            employeeId: data.employeeId || data.id || 'N/A'
          };
          this.currentUser.set(formattedUser);
          // Optional: Update localStorage so other components benefit
          localStorage.setItem('currentUser', JSON.stringify({ ...user, ...formattedUser }));
        }
      });
    }
  }

  loadPayrolls() {
    this.isLoading.set(true);
    this.apiService.getMyPayrolls().subscribe({
      next: (res) => {
        if (res.success) {
          const formattedData = res.data.map((p: any) => {
            const paymentDate = p.paymentDate ? new Date(p.paymentDate) : new Date();
            const earnArr = p.earnings || [];
            const calcG = earnArr.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
            return {
              ...p,
              month: p.month || paymentDate.toLocaleString('default', { month: 'long' }),
              year: p.year || paymentDate.getFullYear(),
              period: p.period || `${paymentDate.toLocaleString('default', { month: 'long' })} ${paymentDate.getFullYear()}`,
              status: p.status || 'Paid',
              date: paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              amount: `₹${(p.netAmount || 0).toLocaleString()}`,
              gross: `₹${(p.grossAmount || calcG || 0).toLocaleString()}`,
              deductions: `₹${(p.totalDeductions || 0).toLocaleString()}`,
              earnings: earnArr.map((e: any) => ({ label: e.label, amount: `₹${(e.amount || 0).toLocaleString()}` })),
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
      this.showSuccess("Downloading your original salary slip...");
      const link = document.createElement('a');
      link.href = stub.pdfUrl;
      link.download = `Payslip_${stub.month.replace(' ', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    this.showSuccess("Generating your salary slip... Please wait.");
    console.log(`🚀 Starting generation for: ${stub.month}`);

    const doc = new jsPDF();
    const user = this.currentUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');

    const logoUrl = '/logo.png';
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      // 1. Header & Company Branding
      // Brand 5: #2c9be6ff (Dark Blue)
      // White Background for professional look
      doc.setFillColor(255, 255, 255); 
      doc.rect(0, 0, 210, 45, 'F');
      
      // Divider line using brand blue
      doc.setDrawColor(72, 128, 165);
      doc.setLineWidth(0.5);
      doc.line(0, 45, 210, 45);
      
      try {
        // Logo without the white box background needed now
        doc.addImage(img, 'PNG', 18, 10, 24, 20);
        
        // Tagline under logo (Larger & Black)
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('Passion for discover possibilities', 30, 40, { align: 'center' });
      } catch (e) {
        console.error("Logo failed to load", e);
      }
      
      // Header Text in Black
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Hamsa Hitech Pvt. Ltd.', 115, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text([
        '208, Shree residency, Near lakshmi mata mandir,',
        'Balewadi, Pune-411045.',
        'Website: www.hamsahitech.com'
      ], 115, 26, { align: 'center' });

      // Continue with rest of the PDF
      this.generatePdfRest(doc, stub, user);
    };

    img.onerror = () => {
      // Fallback if logo fails
      // Fallback: White Background Header
      doc.setFillColor(255, 255, 255); 
      doc.rect(0, 0, 210, 45, 'F');
      
      // Divider line
      doc.setDrawColor(72, 128, 165);
      doc.setLineWidth(0.5);
      doc.line(0, 45, 210, 45);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Hamsa Hitech Pvt. Ltd.', 105, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text([
        '208, Shree residency, Near lakshmi mata mandir,',
        'Balewadi, Pune-411045.',
        'Website: www.hamsahitech.com'
      ], 105, 26, { align: 'center' });
      
      // Tagline under logo area (Black)
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('Passion for discover possibilities', 30, 40, { align: 'center' });
      
      this.generatePdfRest(doc, stub, user);
    };
  }
  generatePdfRest(doc: jsPDF, stub: any, user: any) {
    const formatAmt = (val: any) => {
      if (!val) return '0.00';
      const num = Number(String(val).replace(/[^0-9.]/g,'')) || 0;
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const earningsBody = stub.earnings ? stub.earnings.map((e: any) => [
      e.label, 
      formatAmt(e.actualAmount || e.amount), 
      formatAmt(e.amount)
    ]) : [];
    const deductionsBody = stub.deductionsList ? stub.deductionsList.map((d: any) => [d.label, formatAmt(d.amount)]) : [];

    // Helper to format date to 1-Oct-25
    const formatDate = (date: any) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      const day = d.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`;
    };

    // 2. Payslip header title bar
    doc.setLineWidth(0.5);
    doc.setDrawColor(0);
    doc.rect(10, 50, 190, 8); 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const displayMonth = (stub.month || new Date().toLocaleString('default', { month: 'long' })).toUpperCase();
    const displayYear = stub.year || new Date().getFullYear();
    const titleText = `SALARY SLIP FOR THE MONTH ${displayMonth} ${displayYear}`;
    doc.text(titleText, 105, 55.5, { align: 'center' });
    const lineXOffset = (doc as any).getTextWidth(titleText) / 2;
    doc.line(105 - lineXOffset, 56.5, 105 + lineXOffset, 56.5); // Underline

    // 3. Employee Info Grid Box
    doc.rect(10, 58, 190, 50); 
    const rowY = (index: number) => 68 + (index * 8);
    const fullName = stub.employeeName || user.name || (user.firstName + ' ' + (user.lastName || '')).trim();

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Code', 15, rowY(0));
    doc.text('Joining Date', 15, rowY(1));
    doc.text('Designation', 15, rowY(2));
    doc.text('Day Present', 15, rowY(3));
    doc.text('Total Days', 15, rowY(4));

    doc.setFont('helvetica', 'normal');
    doc.text(`${user.employeeId || stub.employeeId || 'N/A'}`, 50, rowY(0));
    doc.text(`${formatDate(user.joiningDate)}`, 50, rowY(1));
    doc.text(`${stub.designation || user.designation || 'N/A'}`, 50, rowY(2));
    // Automatic calendar day calculation for accurate monthly stats
    const getActualDaysInMonth = (monthName: string, yearNum: number) => {
      const monthList = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const upperName = (monthName || '').toUpperCase();
      const mIndex = monthList.findIndex(m => upperName.startsWith(m) || upperName.includes(m));
      return mIndex !== -1 ? new Date(yearNum, mIndex + 1, 0).getDate() : 30;
    };

    const monthStr = stub.month || 'January';
    const yearNum = Number(stub.year || new Date().getFullYear());
    
    // Prioritize backend record for days, fallback to calendar calculation for missing data
    const totalDaysNum = Number(stub.totalDays || stub.total_days || stub.days_in_month || getActualDaysInMonth(monthStr, yearNum));
    const absentDaysNum = Number(stub.daysAbsent || stub.absentDays || stub.days_absent || stub.leaves || stub.leavesTaken || 0);
    // Use specific backend present count if available, otherwise calculate (max out at total month days)
    const rawPresent = stub.daysPresent || stub.presentDays || stub.days_present || stub.workingDays || (totalDaysNum - absentDaysNum);
    const presentDaysNum = Math.min(Number(rawPresent), totalDaysNum);

    doc.text(`${presentDaysNum}`, 50, rowY(3));
    doc.text(`${totalDaysNum}`, 50, rowY(4));

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Name', 115, rowY(0));
    doc.text('Confirmation Date', 115, rowY(1));
    doc.text('Department', 115, rowY(2));
    doc.text('Days Absent', 115, rowY(3));
    doc.setFont('helvetica', 'normal');
    doc.text(fullName, 155, rowY(0));
    doc.text(`${formatDate(user.confirmationDate)}`, 155, rowY(1));
    doc.text(`${user.role || user.department || 'N/A'}`, 155, rowY(2));
    doc.text(`${absentDaysNum}`, 155, rowY(3));
    doc.setFont('helvetica', 'normal');

    
    const calcGrossVal = (eList: any[]) => {
      const total = eList?.reduce((sum, e) => {
        const val = Number(e.amount?.replace(/[^0-9.]/g,'') || 0);
        return sum + val;
      }, 0) || 0;
      return formatAmt(total);
    };

    const finalGross = calcGrossVal(stub.earnings);

    // Earnings Table
    autoTable(doc, {
      startY: 115,
      head: [['Earnings Description', 'Actual', 'Earned']],
      body: [
        ...earningsBody,
        ['Gross Salary', finalGross, finalGross]
      ],
      theme: 'grid',
      headStyles: { fillColor: [72, 128, 165], textColor: 255, fontStyle: 'bold' }, 
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: 5, right: 108 }
    });

    // Deductions Table
    autoTable(doc, {
      startY: 115,
      head: [['Deductions Description', 'Amount']],
      body: [
        ...deductionsBody,
        ['Total Deductions', `- ${formatAmt(stub.deductions)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' }, 
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 108, right: 5 }
    });

    // 4. Summary & Net Amount
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const netLabel = 'Net Payable Salary:  ';
    const netVal = `${formatAmt(stub.amount)}`;
    const rightEdge = 200;
    doc.text(netVal, rightEdge - 5, finalY, { align: 'right' });
    doc.text(netLabel, rightEdge - 5 - doc.getTextWidth(netVal), finalY, { align: 'right' });

    // 5. Signature Section
    const sigY = finalY + 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0);
    doc.rect(10, sigY, 190, 20); // Signature box
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Head (Accounting)', 12, sigY + 8);
    doc.text('(Signature & Company Seal)', 12, sigY + 15);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('* This is a computer-generated document and does not require a physical signature.', 105, sigY + 28, { align: 'center' });

    // 6. Save the PDF
    doc.save(`Payslip_${stub.month.replace(' ', '_')}.pdf`);
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
