import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isSuccess = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.isSuccess = false;
      
      console.log('Reset password request for:', this.forgotPasswordForm.value.email);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        this.isSuccess = true;
        // Optionally redirect after a few seconds
        // setTimeout(() => this.router.navigate(['/login']), 3000);
      }, 1500);
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
