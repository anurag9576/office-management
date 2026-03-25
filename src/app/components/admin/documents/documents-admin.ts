import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-documents-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-admin.html',
  styleUrl: './documents-admin.css'
})
export class DocumentsAdmin implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  
  employees = signal<any[]>([]);
  templates = signal<any[]>([]);
  issuedDocuments = signal<any[]>([]);
  requests = signal<any[]>([]);
  activeTab = signal<'issued' | 'requests'>('issued');
  
  showModal = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;

  activeTabList = computed(() => {
    return this.activeTab() === 'issued' ? this.issuedDocuments() : this.requests();
  });

  paginatedList = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.activeTabList().slice(startIndex, startIndex + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.activeTabList().length / this.itemsPerPage) || 1;
  });

  startRange = computed(() => {
    if (this.activeTabList().length === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage + 1;
  });

  endRange = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage, this.activeTabList().length);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  setTab(tab: 'issued' | 'requests') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }
  
  issueForm: any = {
    employeeId: '',
    templateId: '',
    customContent: '',
    requestId: null
  };

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'requests') {
        this.activeTab.set('requests');
      }
    });

    this.loadEmployees();
    this.loadTemplates();
    this.loadIssuedDocuments();
    this.loadRequests();
  }

  loadEmployees() {
    this.apiService.getEmployees().subscribe({
      next: (res) => {
        if (res.success) this.employees.set(res.data);
      },
      error: (err) => console.error('Error loading employees:', err)
    });
  }

  loadTemplates() {
    this.apiService.getDocumentTemplates().subscribe({
      next: (res) => {
        if (res.success) this.templates.set(res.data);
      },
      error: (err) => console.error('Error loading templates:', err)
    });
  }

  loadIssuedDocuments() {
    this.isLoading.set(true);
    this.apiService.getAllIssuedDocuments().subscribe({
      next: (res) => {
        if (res.success) this.issuedDocuments.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading issued docs:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadRequests() {
    this.apiService.getAllRequests().subscribe({
      next: (res) => {
        if (res.success) this.requests.set(res.data);
      },
      error: (err) => console.error('Error loading requests:', err)
    });
  }

  showIssueModal() {
    this.issueForm = { employeeId: '', templateId: '', customContent: '', requestId: null };
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  approveRequest(req: any) {
    this.issueForm = {
      employeeId: req.employee._id,
      templateId: req.template ? req.template._id : '',
      customContent: '',
      requestId: req._id
    };
    
    if (!req.template) {
       this.errorMessage.set(`Custom request for: "${req.customDocumentName}". Select template.`);
    } else {
       this.errorMessage.set('');
    }
    
    this.showModal.set(true);
  }

  rejectRequest(req: any) {
    if (!confirm('Are you sure you want to reject this document request?')) return;
    
    this.apiService.updateRequestStatus(req._id, 'Rejected').subscribe({
      next: (res) => {
        if (res.success) {
           this.successMessage.set('Request rejected.');
           this.loadRequests();
           setTimeout(() => this.successMessage.set(''), 3000);
        }
      },
      error: (err) => console.error('Error rejecting request:', err)
    });
  }

  issueDocument() {
    if (!this.issueForm.employeeId || !this.issueForm.templateId) {
      this.errorMessage.set('Please select both employee and document type.');
      return;
    }

    this.isLoading.set(true);
    this.apiService.issueDocument(this.issueForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage.set('Document issued successfully!');
          this.loadIssuedDocuments();
          if (this.issueForm.requestId) this.loadRequests();
          this.closeModal();
          setTimeout(() => this.successMessage.set(''), 3000);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error issuing document');
        this.isLoading.set(false);
      }
    });
  }
}
