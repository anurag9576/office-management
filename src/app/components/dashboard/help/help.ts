import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help.html',
  styleUrl: './help.css',
})
export class Help {
  searchQuery = signal('');
  activeCategoryId = signal<string | null>(null);
  showSupportForm = signal(false);
  
  supportForm = signal({
    name: '',
    email: '',
    category: 'tech',
    title: '',
    description: ''
  });

  isSubmitting = signal(false);
  submitSuccess = signal(false);
  
  categories = computed(() => {
    const list = this.faqs();
    return [
      { id: 'tech', label: 'Tech & Access', icon: 'terminal', count: list.filter(f => f.category === 'tech').length },
      { id: 'hr', label: 'HR & Benefits', icon: 'volunteer_activism', count: list.filter(f => f.category === 'hr').length },
      { id: 'payroll', label: 'Finance & Tax', icon: 'account_balance', count: list.filter(f => f.category === 'payroll').length },
      { id: 'admin', label: 'Admin & Assets', icon: 'inventory_2', count: list.filter(f => f.category === 'admin').length },
    ];
  });

  faqs = signal([
    {
      id: 1,
      category: 'tech',
      question: 'How do I request a new software license (e.g., IntelliJ, Adobe)?',
      answer: "Go to the 'IT Asset Portal' or raise a Jira ticket under the 'Software Request' category. Approvals from your Team Lead and HOD are required for paid versions.",
      isOpen: false
    },
    {
      id: 2,
      category: 'hr',
      question: 'What is the current Work From Home (WFH) policy?',
      answer: "At Hamsa, we prioritize collaboration and team synergy, so physical presence in the office is our primary model. Remote work (WFH) is strictly considered only on an exceptional basis for serious health or personal emergencies, subject to prior approval from your Manager and HR.",
      isOpen: false
    },
    {
      id: 3,
      category: 'payroll',
      question: 'Where can I submit my investment proofs for tax saving?',
      answer: "Tax declarations are open every quarter. You can upload your proofs (80C, HRA, etc.) in the 'Finance' tab under the 'Declarations' sub-section.",
      isOpen: false
    },
    {
      id: 4,
      category: 'admin',
      question: 'How to report a lost or damaged ID card / laptop?',
      answer: "Report immediately to the Admin desk or Security. For laptops, a police complaint (FIR) copy may be required for insurance claims before a replacement is issued.",
      isOpen: false
    },
    {
      id: 6,
      category: 'hr',
      question: 'What is the Leave Policy & Paid Leave benefits?',
      answer: "You are entitled to 12 Casual Leaves and 6 Sick Leaves annually (Total 18 Paid Leaves). If you take more than 18 leaves, they will be considered Loss of Pay (LOP), and salary will be deducted as per your per-day rate.",
      isOpen: false
    },
    {
      id: 7,
      category: 'hr',
      question: 'How to apply for leave correctly?',
      answer: "Step 1: Inform your Manager. Step 2: Send an email to hr@hamasa.com. Step 3: Apply officially on this Dashboard App. Following all three steps is mandatory for approval.",
      isOpen: false
    },
    {
      id: 5,
      category: 'tech',
      question: 'How do I connect to the Office VPN from home?',
      answer: "Use the 'GlobalProtect' or 'Cisco AnyConnect' client. Ensure MFA is enabled via the PingID app on your phone. Detailed setup guide is in the 'Tech Docs' section.",
      isOpen: false
    }
  ]);

  filteredFaqs() {
    let result = this.faqs();
    const query = this.searchQuery().toLowerCase();
    const activeCat = this.activeCategoryId();

    // Filter by Category if one is selected
    if (activeCat) {
      result = result.filter(f => f.category === activeCat);
    }

    // Then filter by text search
    if (query) {
      result = result.filter(f => 
        f.question.toLowerCase().includes(query) || 
        f.answer.toLowerCase().includes(query)
      );
    }

    return result;
  }

  filterByCategory(catId: string) {
    // If same category is clicked, clear filter
    if (this.activeCategoryId() === catId) {
      this.activeCategoryId.set(null);
    } else {
      this.activeCategoryId.set(catId);
      this.searchQuery.set(''); // Clear text search when switching category for better results
    }
    
    // Reset all FAQs to closed
    this.faqs.update(items => items.map(i => ({ ...i, isOpen: false })));
  }

  toggleFaq(id: number) {
    this.faqs.update(items => items.map(item => ({
      ...item,
      isOpen: item.id === id ? !item.isOpen : false
    })));
  }

  contactSupport() {
    this.showSupportForm.set(true);
    // Scroll to top if needed or show modal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeSupportForm() {
    this.showSupportForm.set(false);
    this.submitSuccess.set(false);
  }

  submitTicket() {
    const data = this.supportForm();
    if (!data.title || !data.description) {
      alert('Please fill all required fields');
      return;
    }

    this.isSubmitting.set(true);
    
    // Simulating API call for demonstration
    setTimeout(() => {
      console.log('Support Ticket Submitted:', data);
      this.isSubmitting.set(false);
      this.submitSuccess.set(true);
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        this.closeSupportForm();
        this.supportForm.set({ name: '', email: '', category: 'tech', title: '', description: '' });
      }, 2000);
    }, 1500);
  }
}
