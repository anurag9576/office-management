import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastNotification } from './components/shared/toast-notification/toast-notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastNotification],
  template: `
    <router-outlet></router-outlet>
    <app-toast-notification></app-toast-notification>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('office-management');
}
