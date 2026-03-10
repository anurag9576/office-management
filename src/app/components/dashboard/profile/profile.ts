import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private apiService = inject(ApiService);
  
  employee = signal<any>({
    name: '',
    role: '',
    id: '',
    status: '',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200',
    email: '',
    officeEmail: '',
    phone: '',
    address: '',
    emergencyContact: '',
    location: '',
    joinDate: '',
    department: '',
    manager: '',
    currentProject: '',
    experience: '',
    bio: '',
    skills: [],
    documents: [],
    performance: {
      rating: '0/5',
      achievements: 0,
      completedTasks: 0
    }
  });

  sharedDocuments = signal<any[]>([]);

  showModal = signal(false);
  editSection = signal<string>('');
  tempEmployee: any = {};
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const userId = user._id || user.id;
    if (!userId) return;

    this.isLoading.set(true);
    this.apiService.getEmployeeById(userId).subscribe({
      next: (res) => {
        const data = res.data || res;
        // Format the date if it exists
        const joinDateFormatted = data.joiningDate 
          ? new Date(data.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'N/A';

        // Map backend fields to frontend signal
        this.employee.set({
          ...this.employee(), // Keep defaults for missing fields
          ...data,
          name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.name || ''),
          id: data.employeeId || data.id || '',
          officeEmail: data.email || '',
          email: data.personalEmail || '', // Backend 'personalEmail' maps to frontend 'email'
          joinDate: joinDateFormatted,
          location: data.location || 'Baner, Pune' // Default location
        });
        // Set dummy documents that point to our real backend public folder
        this.sharedDocuments.set([
          { 
            name: 'Joining_Letter.pdf', 
            sender: 'HR Department',
            size: '1.2 MB', 
            icon: 'description',
            date: '05 Jan 2025', 
            url: 'http://localhost:5000/docs/Joining_Letter.pdf' 
          },
          { 
            name: 'Code_of_Conduct.pdf', 
            sender: 'Admin',
            size: '2.4 MB', 
            icon: 'policy',
            date: '12 Feb 2025', 
            url: 'http://localhost:5000/docs/Code_of_Conduct.pdf' 
          }
        ]);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.errorMessage.set('Failed to load profile data.');
        this.isLoading.set(false);
      }
    });
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  openEditModal(section: string) {
    this.editSection.set(section);
    this.tempEmployee = JSON.parse(JSON.stringify(this.employee()));
    this.showModal.set(true);
  }

  saveChanges() {
    const userId = this.tempEmployee._id || this.tempEmployee.id;
    if (!userId) {
      this.errorMessage.set('User ID not found.');
      return;
    }

    this.isLoading.set(true);
    const updateData = { ...this.tempEmployee };
    
    // Reverse field mapping for backend compatibility
    updateData.personalEmail = this.tempEmployee.email; // 'email' field in UI is personal
    updateData.email = this.tempEmployee.officeEmail; // 'officeEmail' in UI is work email
    
    // Clean up temporary UI fields before sending to backend
    delete updateData.email_ui; // (if any)
    delete updateData.officeEmail;
    delete updateData.id; 
    // Note: We keep _id as it's often ignored by findByIdAndUpdate but used in the URL

    // Split name into firstName and lastName for backend compatibility
    if (this.tempEmployee.name) {
      const names = this.tempEmployee.name.trim().split(/\s+/);
      updateData.firstName = names[0] || '';
      updateData.lastName = names.slice(1).join(' ') || '';
    }

    this.apiService.updateEmployee(userId, updateData).subscribe({
      next: (res) => {
        // Update the main signal with the confirmed data from backend
        const data = res.data || res;
        this.loadProfile(); // Re-run load to get fresh formatted data
        this.showModal.set(false);
        this.isLoading.set(false);
        this.showSuccess('Profile updated successfully!');
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.errorMessage.set(err.error?.message || 'Failed to save profile changes.');
        this.isLoading.set(false);
      }
    });
  }

  closeModal() {
    this.showModal.set(false);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const avatarData = e.target.result;
        
        // Optionally save to backend immediately
        const userId = this.employee()._id || this.employee().id;
        if (userId) {
          this.isLoading.set(true);
          this.apiService.updateEmployee(userId, { avatar: avatarData }).subscribe({
            next: (res) => {
              this.employee.update(emp => ({ ...emp, avatar: avatarData }));
              this.isLoading.set(false);
              this.showSuccess('Profile photo updated!');
            },
            error: (err) => {
              console.error('Error uploading photo:', err);
              this.errorMessage.set('Failed to upload photo.');
              this.isLoading.set(false);
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  downloadDoc(url: string) {
    if (url) {
      alert("Downloading document... " + url.split('/').pop());
      // Primary method: Open in new tab
      window.open(url, '_blank');
      
      // Fallback: Create a hidden link and click it
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = url.split('/').pop() || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

