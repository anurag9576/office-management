import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.css'
})
export class ChangePasswordModal {
  @Output() passwordChanged = new EventEmitter<void>();
  
  passwordForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  togglePasswordVisibility() {
    this.passwordVisible.set(!this.passwordVisible());
  }

  toggleConfirmVisibility() {
    this.confirmPasswordVisible.set(!this.confirmPasswordVisible());
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const { newPassword } = this.passwordForm.value;
      
      this.apiService.changePassword({ newPassword }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            // Update local storage user object
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            user.passwordChanged = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.passwordChanged.emit();
          } else {
            this.errorMessage.set(res.message || 'Failed to update password');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Something went wrong');
        }
      });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }
}
