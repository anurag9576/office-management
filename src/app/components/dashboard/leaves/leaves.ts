import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaves.html',
  styleUrl: './leaves.css',
})
export class Leaves implements OnInit {
  private apiService = inject(ApiService);
  currentDate = signal(new Date());
  calendarDays = signal<{ day: number | null, isToday: boolean, isHoliday: boolean, isWeekend: boolean, holidayName?: string }[]>([]);
  monthYearString = signal('');

  leaveStats = signal([
    { label: 'Total Leaves', value: 18, icon: 'assessment', color: 'bg-brand-1/10 text-brand-1' },
    { label: 'Taken', value: 0, icon: 'event_busy', color: 'bg-orange-50 text-orange-500' },
    { label: 'Available', value: 18, icon: 'today', color: 'bg-green-50 text-green-500' },
    { label: 'Pending', value: 0, icon: 'pending_actions', color: 'bg-brand-4/10 text-brand-4' }
  ]);

  holidays = signal([
    { name: 'New Year Day', date: 'Jan 01, 2026', type: 'Mandatory', day: 1, month: 0, year: 2026 },
    { name: 'Republic Day', date: 'Jan 26, 2026', type: 'Mandatory', day: 26, month: 0, year: 2026 },
    { name: 'Holi', date: 'Mar 03, 2026', type: 'Mandatory', day: 3, month: 2, year: 2026 },
    { name: 'Gudi Padwa', date: 'Mar 19, 2026', type: 'Mandatory', day: 19, month: 2, year: 2026 },
    { name: 'May Day', date: 'May 01, 2026', type: 'Mandatory', day: 1, month: 4, year: 2026 },
    { name: 'Ganesh Chaturthi', date: 'Sep 14, 2026', type: 'Mandatory', day: 14, month: 8, year: 2026 },
    { name: 'Gandhi Jayanti', date: 'Oct 02, 2026', type: 'Mandatory', day: 2, month: 9, year: 2026 },
    { name: 'Dussehra', date: 'Oct 20, 2026', type: 'Mandatory', day: 20, month: 9, year: 2026 },
    { name: 'Diwali', date: 'Nov 06, 2026', type: 'Mandatory', day: 6, month: 10, year: 2026 },
    { name: 'Christmas', date: 'Dec 25, 2026', type: 'Mandatory', day: 25, month: 11, year: 2026 }
  ]);

  recentLeaves = signal<any[]>([]);

  leaveForm = {
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  };

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  showAllHolidays = signal(false);
  displayedHolidays = computed(() => this.showAllHolidays() ? this.holidays() : this.holidays().slice(0, 3));

  constructor() {
    this.generateCalendar();
  }

  ngOnInit() {
    this.loadMyLeaves();
  }

  loadMyLeaves() {
    this.isLoading.set(true);
    this.apiService.getMyLeaves().subscribe({
      next: (res) => {
        if (res.success) {
          const stats = res.stats;
          this.leaveStats.set([
            { label: 'Total Leaves', value: stats.total, icon: 'assessment', color: 'bg-brand-1/10 text-brand-1' },
            { label: 'Taken', value: stats.taken, icon: 'event_busy', color: 'bg-orange-50 text-orange-500' },
            { label: 'Available', value: stats.available, icon: 'today', color: 'bg-green-50 text-green-500' },
            { label: 'Pending', value: stats.pending, icon: 'pending_actions', color: 'bg-brand-4/10 text-brand-4' }
          ]);

          // Format recent leaves for display
          this.recentLeaves.set(res.data.map((l: any) => ({
            type: l.type,
            from: new Date(l.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            to: new Date(l.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            days: l.days,
            status: l.status
          })));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching leaves:', err);
        this.isLoading.set(false);
      }
    });
  }

  applyLeave() {
    if (!this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.errorMessage.set('Please fill all fields');
      return;
    }

    const start = new Date(this.leaveForm.startDate);
    const end = new Date(this.leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leaveData = {
      ...this.leaveForm,
      days: diffDays
    };

    this.isLoading.set(true);
    this.apiService.applyLeave(leaveData).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set('Leave application submitted successfully!');
          this.loadMyLeaves(); // Reload stats and list
          // Reset form
          this.leaveForm = { type: 'Casual Leave', startDate: '', endDate: '', reason: '' };
        }
        this.isLoading.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to submit application');
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 3000);
      }
    });
  }

  generateCalendar() {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    this.monthYearString.set(new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date));

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days: { day: number | null, isToday: boolean, isHoliday: boolean, isWeekend: boolean, holidayName?: string }[] = [];

    // Fill leading empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({ day: null, isToday: false, isHoliday: false, isWeekend: false });
    }

    // Fill actual days
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const dayOfWeek = new Date(year, month, i).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
        const holiday = (this.holidays() as any[]).find(h => h.day === i && h.month === month && h.year === year);
        days.push({ 
            day: i, 
            isToday, 
            isHoliday: !!holiday,
            isWeekend,
            holidayName: holiday?.name
        });
    }

    this.calendarDays.set(days);
  }

  prevMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.generateCalendar();
  }

  nextMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    this.generateCalendar();
  }
}
