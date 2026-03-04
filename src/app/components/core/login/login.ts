import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  passwordVisible = false;
  isLoading = false;
  loginError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError.set(null);
      const { email, password } = this.loginForm.value;

      this.http.get<any[]>('data/users.json').subscribe({
        next: (users) => {
          const user = users.find(u => u.email === email && u.password === password);
          
          setTimeout(() => {
            this.isLoading = false;
            if (user) {
              // Store user info for sidebar
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.router.navigate(['/dashboard']);
            } else {
              this.loginError.set('Invalid email or password. Please try again.');
            }
          }, 1000);
        },
        error: (err) => {
          this.isLoading = false;
          this.loginError.set('Something went wrong. Please try again later.');
          console.error('Login error:', err);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
