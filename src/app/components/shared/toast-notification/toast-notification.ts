import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.html',
  styleUrl: './toast-notification.css'
})
export class ToastNotification {
  toast = inject(ToastService);

  bgColorClass() {
    switch (this.toast.type()) {
      case 'success': return 'bg-white border-emerald-500 text-emerald-600';
      case 'error': return 'bg-white border-red-500 text-red-600';
      case 'warning': return 'bg-white border-amber-500 text-amber-600';
      default: return 'bg-white border-brand-1 text-brand-1';
    }
  }

  iconBgClass() {
    switch (this.toast.type()) {
      case 'success': return 'bg-emerald-50 text-emerald-600';
      case 'error': return 'bg-red-50 text-red-600';
      case 'warning': return 'bg-amber-50 text-amber-600';
      default: return 'bg-brand-1/10 text-brand-1';
    }
  }

  labelColorClass() {
    switch (this.toast.type()) {
      case 'success': return 'text-emerald-500/80';
      case 'error': return 'text-red-500/80';
      case 'warning': return 'text-amber-500/80';
      default: return 'text-brand-1/80';
    }
  }

  iconName() {
    switch (this.toast.type()) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  labelText() {
    switch (this.toast.type()) {
      case 'success': return 'Success';
      case 'error': return 'Alert';
      case 'warning': return 'Warning';
      default: return 'Update';
    }
  }
}
