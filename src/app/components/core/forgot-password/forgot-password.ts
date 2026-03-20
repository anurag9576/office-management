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

  removeWhiteBg(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.getAttribute('data-processed')) return;
    
    // Create a canvas to process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    canvas.width = img.naturalWidth || img.width || 200;
    canvas.height = img.naturalHeight || img.height || 200;
    
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // The blue logo is roughly R:24, G:149, B:222
        // Any pixel that is relatively light/grey (R, G, B > 150) is background
        if (data[i] > 150 && data[i+1] > 150 && data[i+2] > 150) {
          data[i+3] = 0; // completely transparent!
        } else if (data[i] > 100 && data[i+1] > 100 && data[i+2] > 100) {
            // Anti-aliasing edges - make them semi-transparent
            data[i+3] = 100;
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      img.setAttribute('data-processed', 'true');
      img.src = canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Canvas processing failed:', e);
      // Fallback CSS trick if canvas is tainted
      img.style.mixBlendMode = 'multiply';
      img.style.filter = 'contrast(1.5) brightness(1.2)';
    }
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
