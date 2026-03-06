import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isMobileOpen = signal(false);

  toggleMobile() {
    this.isMobileOpen.set(!this.isMobileOpen());
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }
}
