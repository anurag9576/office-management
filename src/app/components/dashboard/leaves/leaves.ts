import { Component, OnInit, signal, computed, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerIntl } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class CustomDatepickerIntl extends MatDatepickerIntl {
  override prevMonthLabel = '';
  override nextMonthLabel = '';
  override prevYearLabel = '';
  override nextYearLabel = '';
  override prevMultiYearLabel = '';
  override nextMultiYearLabel = '';
  override switchToMonthViewLabel = '';
  override switchToMultiYearViewLabel = '';
}

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MatDatepickerIntl, useClass: CustomDatepickerIntl }
  ],
  templateUrl: './leaves.html',
  styleUrl: './leaves.css',
})
export class Leaves implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  currentDate = signal(new Date());
  minDate = signal(new Date());
  calendarDays = signal<{ day: number | null, isToday: boolean, isHoliday: boolean, isWeekend: boolean, isLeave: boolean, holidayName?: string }[]>([]);
  monthYearString = signal('');
  rawLeaves = signal<any[]>([]);
  availableLeaves = signal(18);

  leaveStats = signal([
    { label: 'Total Leaves', value: 18, icon: 'assessment', color: 'bg-brand-1/10 text-brand-1' },
    { label: 'Taken', value: 0, icon: 'event_busy', color: 'bg-orange-50 text-orange-500' },
    { label: 'Available', value: 18, icon: 'today', color: 'bg-green-50 text-green-500' },
    { label: 'Pending', value: 0, icon: 'pending_actions', color: 'bg-brand-4/10 text-brand-4' },
    { label: 'Loss of Pay', value: 0, icon: 'money_off', color: 'bg-red-50 text-red-500' }
  ]);

  holidays = signal<any[]>([]);

  recentLeaves = signal<any[]>([]);

  leaveForm = {
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  };

  isLoading = signal(false);

  showAllHolidays = signal(false);
  displayedHolidays = computed(() => this.showAllHolidays() ? this.holidays() : this.holidays().slice(0, 3));

  constructor() {
    this.generateCalendar();
  }

  ngOnInit() {
    this.loadMyLeaves();
    this.loadHolidays();
  }

  loadHolidays() {
    this.apiService.getHolidays().subscribe({
        next: (res) => {
            if (res.success) {
                this.holidays.set(res.data);
                this.generateCalendar();
            }
        }
    });
  }

  loadMyLeaves() {
    this.isLoading.set(true);
    this.apiService.getMyLeaves().subscribe({
      next: (res) => {
        console.log('Raw API Response:', res);
        try {
          console.log('Leaves API Response:', res);
          const leavesArray = res.leaves || res.data || [];
          const stats = res.stats || { total: 18, taken: 0, available: 18, pending: 0 };
          
          if (Array.isArray(leavesArray)) {
            this.leaveStats.set([
              { label: 'Total Leaves', value: stats.total, icon: 'assessment', color: 'bg-brand-1/10 text-brand-1' },
              { label: 'Taken', value: stats.taken, icon: 'event_busy', color: 'bg-orange-50 text-orange-500' },
              { label: 'Available', value: stats.available, icon: 'today', color: 'bg-green-50 text-green-500' },
              { label: 'Pending', value: stats.pending, icon: 'pending_actions', color: 'bg-brand-4/10 text-brand-4' },
              { label: 'Loss of Pay', value: stats.lwp || 0, icon: 'money_off', color: 'bg-red-50 text-red-500' }
            ]);

            // Map and format recent leaves
            this.recentLeaves.set(leavesArray.map((l: any) => ({
              type: l.type,
              from: new Date(l.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              to: new Date(l.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              days: l.days,
              status: l.status
            })));

            this.rawLeaves.set(leavesArray);
            this.availableLeaves.set(stats.available);
            this.generateCalendar();
          }
        } catch (err) {
            console.error('Error in processing leaves:', err);
        } finally {
            this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error fetching leaves:', err);
        this.isLoading.set(false);
      }
    });
  }

  applyLeave() {
    if (!this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.toastService.show('Please fill all required fields', 'error');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(this.leaveForm.startDate);
    const end = new Date(this.leaveForm.endDate);

    if (start < today) {
      this.toastService.show('Cannot apply leave for past dates', 'error');
      return;
    }

    if (end < start) {
      this.toastService.show('End date cannot be before start date', 'error');
      return;
    }
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
          this.toastService.show('Leave application submitted successfully!', 'success');
          this.loadMyLeaves(); 
          this.leaveForm = { type: 'Casual Leave', startDate: '', endDate: '', reason: '' };
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to submit application', 'error');
        this.isLoading.set(false);
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

    const days: { day: number | null, isToday: boolean, isHoliday: boolean, isWeekend: boolean, isLeave: boolean, holidayName?: string }[] = [];

    // Fill leading empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push({ day: null, isToday: false, isHoliday: false, isWeekend: false, isLeave: false });
    }

    // Fill actual days
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const dayOfWeek = new Date(year, month, i).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
        const holiday = (this.holidays() as any[]).find(h => h.day === i && h.month === month && h.year === year);
        
        // Check if this date is part of an approved leave
        const currentDateObj = new Date(year, month, i);
        const isLeave = this.rawLeaves().some(l => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            // Reset hours for accurate comparison
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            currentDateObj.setHours(0,0,0,0);
            return l.status?.toLowerCase() === 'approved' && currentDateObj >= start && currentDateObj <= end;
        });

        days.push({ 
            day: i, 
            isToday, 
            isHoliday: !!holiday,
            isWeekend,
            isLeave,
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
