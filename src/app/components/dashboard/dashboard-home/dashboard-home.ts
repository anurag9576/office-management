import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css'
})
export class DashboardHome implements OnInit {
  userName = signal('User');

  constructor(private router: Router) {}

  ngOnInit() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role.toLowerCase() === 'admin') {
        console.log('Redirecting Admin from DashboardHome to Admin Dashboard');
        this.router.navigateByUrl('/dashboard/admin-home');
      } else {
        this.userName.set(user.name.split(' ')[0]);
      }
    }
  }
}
