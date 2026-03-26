import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  message = signal<string | null>(null);
  type = signal<ToastType>('success');
  isVisible = signal(false);

  show(message: string, type: ToastType = 'success', duration: number = 2000) {
    this.message.set(message);
    this.type.set(type);
    this.isVisible.set(true);

    setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.isVisible.set(false);
    setTimeout(() => {
      this.message.set(null);
    }, 300); // Wait for fade-out animation
  }
}
