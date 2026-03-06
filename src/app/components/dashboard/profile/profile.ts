import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  employee = signal({
    name: 'Anurag Kumar',
    role: 'Software Developer',
    id: 'EMP1024',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200',
    email: 'anurag.k@personal.com',
    officeEmail: 'test@hamsa.com',
    phone: '+91 98765 43210',
    address: 'H-202, Blue Ridge Society, Hinjewadi Phase 1, Pune, Maharashtra 411057',
    emergencyContact: 'Amit Kumar (+91 99887 76655)',
    location: 'Pune',
    joinDate: '10 Jan 2025',
    department: 'IT',
    manager: 'Sarah Jenkins',
    currentProject: 'Modern HRM Portal',
    experience: '4.5 Years',
    bio: 'Passionate software developer focused on building robust and scalable applications. Experienced in modern web technologies and full-stack development.',
    skills: [
      { name: 'Java', level: '90%' },
      { name: 'Angular', level: '85%' },
      { name: 'SQL', level: '80%' },
      { name: 'Spring Boot', level: '75%' }
    ],
    documents: [
      { name: 'Education_Docs.pdf', type: 'Educational Certificates', date: 'Jan 2025', isSubmitted: true },
      { name: 'PAN_Card.pdf', type: 'PAN Card', date: 'Jan 2025', isSubmitted: true },
      { name: 'Aadhar_Card.pdf', type: 'Aadhaar Card', date: 'Jan 2025', isSubmitted: true },
      { name: 'Photo.jpg', type: 'Passport Sized Photograph', date: 'Jan 2025', isSubmitted: false }
    ],
    performance: {
      rating: '4.8/5.0',
      achievements: 12,
      completedTasks: 156
    }
  });

  sharedDocuments = signal([
    { name: 'Joining_Letter.pdf', sender: 'HR Department', date: '05 Jan 2025', size: '1.2 MB', icon: 'description' },
    { name: 'Code_of_Conduct.pdf', sender: 'Admin', date: '12 Feb 2025', size: '2.4 MB', icon: 'policy' },
    { name: 'Project_Guidelines.zip', sender: 'Sarah Jenkins (Manager)', date: '28 Feb 2025', size: '15.8 MB', icon: 'folder_zip' },
    { name: 'Quarterly_Review_Q1.pdf', sender: 'Finance Dept', date: '01 Mar 2025', size: '850 KB', icon: 'assessment' }
  ]);

  showModal = signal(false);
  editSection = signal<string>('');
  tempEmployee = signal<any>({});

  openEditModal(section: string) {
    this.editSection.set(section);
    this.tempEmployee.set(JSON.parse(JSON.stringify(this.employee())));
    this.showModal.set(true);
  }

  saveChanges() {
    this.employee.set(this.tempEmployee());
    this.showModal.set(false);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.employee.update(emp => ({ ...emp, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  }
}
