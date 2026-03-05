import { Component, signal } from '@angular/core';
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
  
  categories = [
    { id: 'tech', label: 'Tech & Access', icon: 'terminal', count: 18 },
    { id: 'hr', label: 'HR & Benefits', icon: 'volunteer_activism', count: 12 },
    { id: 'payroll', label: 'Finance & Tax', icon: 'account_balance', count: 9 },
    { id: 'admin', label: 'Admin & Assets', icon: 'inventory_2', count: 6 },
  ];

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
      answer: "We follow a hybrid model: 3 days from office and 2 days flexible. Specialized roles may have different arrangements. Check the 'Company Handbook' for full details.",
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
      id: 5,
      category: 'tech',
      question: 'How do I connect to the Office VPN from home?',
      answer: "Use the 'GlobalProtect' or 'Cisco AnyConnect' client. Ensure MFA is enabled via the PingID app on your phone. Detailed setup guide is in the 'Tech Docs' section.",
      isOpen: false
    }
  ]);

  filteredFaqs() {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.faqs();
    return this.faqs().filter(f => 
      f.question.toLowerCase().includes(query) || 
      f.answer.toLowerCase().includes(query)
    );
  }

  toggleFaq(id: number) {
    this.faqs.update(items => items.map(item => ({
      ...item,
      isOpen: item.id === id ? !item.isOpen : false
    })));
  }

  contactSupport() {
    alert('Support ticket system opening soon!');
  }
}
