import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';
import { jsPDF } from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { resizeImage } from '../../../utils/image-utils';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private apiService = inject(ApiService);
  private serverUrl = environment.serverUrl;
  
  employee = signal<any>({
    name: '',
    role: '',
    id: '',
    status: '',
    avatar: null,
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

  myDocuments = signal<any[]>([]);
  templates = signal<any[]>([]);

  showModal = signal(false);
  showRequestModal = signal(false);
  editSection = signal<string>('');
  tempEmployee: any = {};
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  requestForm = {
    documentName: '',
    message: ''
  };

  ngOnInit() {
    this.loadProfile();
    this.loadTemplates();
  }

  loadTemplates() {
    this.apiService.getDocumentTemplates().subscribe({
      next: (res) => {
        if (res.success) this.templates.set(res.data);
      },
      error: (err) => console.error('Error loading templates:', err)
    });
  }

  openRequestModal() {
    this.requestForm = { documentName: '', message: '' };
    this.errorMessage.set('');
    this.showRequestModal.set(true);
  }

  submitRequest() {
    if (!this.requestForm.documentName?.trim()) {
      this.errorMessage.set('Please provide a document type or name.');
      return;
    }

    this.isLoading.set(true);

    const docName = this.requestForm.documentName.trim();
    // Check if entered text matches a template exactly (case-insensitive)
    const matchedTemplate = this.templates().find(
      t => t.name.toLowerCase() === docName.toLowerCase()
    );

    const payload: any = { message: this.requestForm.message };
    
    if (matchedTemplate) {
      payload.templateId = matchedTemplate._id;
    } else {
      payload.customDocumentName = docName;
    }

    this.apiService.requestDocument(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.showSuccess('Request send successfully!');
          this.showRequestModal.set(false);
          this.requestForm = { documentName: '', message: '' };
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error submitting request');
        this.isLoading.set(false);
      }
    });
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
        
        // Fetch real documents from API
        this.loadMyDocuments();

        this.isLoading.set(false);
        
        // Update localStorage to sync with navbar/sidebar
        const updatedUser = {
          ...user,
          name: this.employee().name,
          avatar: data.avatar,
          initials: ((data.firstName?.[0] || '') + (data.lastName?.[0] || (data.firstName?.[1] || 'U'))).toUpperCase()
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.errorMessage.set('Failed to load profile data.');
        this.isLoading.set(false);
      }
    });
  }

  loadMyDocuments() {
    this.apiService.getMyDocuments().subscribe({
      next: (res) => {
        if (res.success) {
          this.myDocuments.set(res.data);
        }
      },
      error: (err) => console.error('Error loading documents:', err)
    });
  }

  async getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async downloadPDF(doc: any) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add border
    pdf.setDrawColor(13, 78, 115); // Brand color 1
    pdf.setLineWidth(1);
    pdf.rect(5, 5, 200, 287);
    
    // Header - New Format
    try {
      const logoBase64 = await this.getBase64ImageFromUrl('/logo.png');
      pdf.addImage(logoBase64, 'PNG', 24, 14, 22, 18); // Logo centered around X=35
    } catch(e) {
      console.error('Failed to load logo', e);
      // Fallback
      pdf.setFillColor(0, 133, 202); 
      pdf.roundedRect(26, 14, 18, 18, 2, 2, 'F');
      pdf.setFontSize(22);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('H', 35, 27, { align: 'center' });
    }

    // Tagline under logo
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Passion for discover possibilities', 35, 36, { align: 'center' });

    // Company Name & Info (Centered safely on the right block)
    const rightCenterX = 125;
    
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Hamsa Hitech Pvt. Ltd.', rightCenterX, 20, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont('helvetica', 'normal');
    pdf.text('208, Shree residency, Near lakshmi mata mandir,', rightCenterX, 26, { align: 'center' });
    pdf.text('Balewadi, Pune-411045.', rightCenterX, 31, { align: 'center' });
    pdf.text('Website: www.hamsahitech.com', rightCenterX, 36, { align: 'center' });
    
    // Bottom separator line
    pdf.setDrawColor(200);
    pdf.line(10, 42, 200, 42);
    
    // Document Title
    pdf.setFontSize(16);
    pdf.setTextColor(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(doc.documentTitle.toUpperCase(), 105, 55, { align: 'center' });
    
    // Content
    pdf.setFontSize(11);
    pdf.setTextColor(60);
    pdf.setFont('helvetica', 'normal');
    
    // Split text into lines for multi-line support
    const splitText = pdf.splitTextToSize(doc.generatedContent, 170);
    pdf.text(splitText, 20, 75);
    
    // Footer
    const footerY = 250;
    pdf.setDrawColor(200);
    pdf.line(20, footerY - 5, 190, footerY - 5);
    
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text('Date of Issue: ' + new Date(doc.issuedDate).toLocaleDateString(), 20, footerY);
    pdf.text('Issued by: Administrative Office', 190, footerY, { align: 'right' });
    
    pdf.setFontSize(8);
    pdf.text('This is an electronically generated document. No signature required.', 105, footerY + 10, { align: 'center' });
    
    // Download
    pdf.save(`${doc.documentTitle.replace(' ', '_')}.pdf`);
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
        this.loadProfile(); 
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

  async onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('Image size should be less than 5MB');
        return;
      }

      this.isLoading.set(true);
      try {
        // Resize image to 800px width before upload
        const resizedFile = await resizeImage(file, 800);
        
        // 1. Upload file using new backend endpoint
        const uploadRes = await firstValueFrom(this.apiService.uploadFile(resizedFile, 'office-management/avatars'));
        
        if (uploadRes.success) {
          const secureUrl = uploadRes.data.path || uploadRes.data.url;
          
          // 2. Update employee photo URL
          const userId = this.employee()._id || this.employee().id;
          if (userId) {
            this.apiService.updateEmployee(userId, { avatar: secureUrl }).subscribe({
              next: (res) => {
                this.employee.update(emp => ({ ...emp, avatar: secureUrl }));
                
                const userStr = localStorage.getItem('currentUser');
                if (userStr) {
                  const user = JSON.parse(userStr);
                  user.avatar = secureUrl;
                  localStorage.setItem('currentUser', JSON.stringify(user));
                }
                this.isLoading.set(false);
                this.showSuccess('Profile photo updated!');
              },
              error: (err) => {
                console.error('Error updating profile avatar link:', err);
                this.errorMessage.set('Photo uploaded, but profile sync failed.');
                this.isLoading.set(false);
              }
            });
          }
        }
      } catch (error) {
        console.error('Backend upload failed:', error);
        this.errorMessage.set('Failed to upload photo to server.');
        this.isLoading.set(false);
      }
    }
  }
}

