import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

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
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
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

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError.set(null);
      const { email, password } = this.loginForm.value;

      this.apiService.login({ email, password }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Backend Login Response:', response);

          // Handle both direct user object and { success: true, data: user } structure
          const userResponse = response.data || response;
          const token = response.token || (response.data ? response.data.token : null);

          if (!userResponse || !userResponse.role) {
            console.error('User data or role missing in response');
            this.loginError.set('Login successful, but user data is invalid.');
            return;
          }

          // Ensure we have first and last names, fallback to empty strings or email part
          const fName = (userResponse.firstName || '').trim();
          const lName = (userResponse.lastName || '').trim();
          const emailPart = userResponse.email ? userResponse.email.split('@')[0] : 'User';

          // Map backend fields to frontend expected fields
          const user = {
            ...userResponse,
            // Priority: existing name -> combined firstName+lastName -> email part
            name: userResponse.fullName || userResponse.name || (fName && lName ? `${fName} ${lName}` : (fName || lName || emailPart)),
            initials: ((fName[0] || '') + (lName[0] || emailPart[0] || 'U')).toUpperCase(),
            token: token 
          };
          
          console.log('Mapped User Object for storage:', user);

          // Store user info and token
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (token) localStorage.setItem('token', token);
          
          const role = (user.role || '').toLowerCase();
          
          // Fetch permissions and then navigate
          this.apiService.getRolePermissions(user.role).subscribe({
            next: (permRes) => {
              if (permRes.success) {
                localStorage.setItem('userPermissions', JSON.stringify(permRes.permissions));
              }
              const targetPath = role === 'admin' ? '/dashboard/admin-home' : '/dashboard';
              console.log('Navigating to:', targetPath, 'User Role is:', role);
              this.router.navigateByUrl(targetPath);
            },
            error: (err) => {
              console.error('Error fetching permissions during login:', err);
              // Store default permissions if failed
              localStorage.setItem('userPermissions', JSON.stringify(['dashboard', 'profile', 'leaves', 'payroll', 'announcement', 'help']));
              const targetPath = role === 'admin' ? '/dashboard/admin-home' : '/dashboard';
              this.router.navigateByUrl(targetPath);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Login error details:', err);
          // Angular HttpClient handles non-2xx status as errors
          const errorMsg = err.error?.message || 'Invalid email or password. Please try again.';
          this.loginError.set(errorMsg);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
