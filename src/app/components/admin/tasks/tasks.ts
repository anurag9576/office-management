import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class TaskMgmt {
  // Board State - Dynamically updated from Status list
  columns = signal([
    { name: 'To-Do', icon: 'list' },
    { name: 'In Development', icon: 'sync' },
    { name: 'QA - Dev Env', icon: 'bug_report' },
    { name: 'Done', icon: 'check_circle' }
  ]);

  showStatusMenu = signal(false);
  
  // No longer hardcoded - we use column names
  get currentStatuses() {
    return this.columns().map(c => c.name);
  }

  tasks = signal<any[]>([]);

  // Modal & Form State
  showCreateModal = signal(false);
  showDetailModal = signal(false);
  showMoreMenu = signal(false);
  showWorkTypeMenu = signal(false);
  showDetailStatusMenu = signal(false);
  selectedTask = signal<any>(null);
  
  workTypes = [
    { name: 'Story', icon: 'bookmark', color: 'text-green-500' },
    { name: 'Task', icon: 'check_box', color: 'text-blue-500' },
    { name: 'Bug', icon: 'bug_report', color: 'text-red-500' },
    { name: 'Epic', icon: 'electric_bolt', color: 'text-purple-500' },
    { name: 'Maintenance', icon: 'build', color: 'text-sky-500' },
    { name: 'Enhancement', icon: 'add_box', color: 'text-emerald-500' }
  ];
  selectedWorkType = signal(this.workTypes[0]);

  showPriorityMenu = signal(false);
  priorities = [
    { name: 'Highest', icon: 'keyboard_double_arrow_up', color: 'text-red-500' },
    { name: 'High', icon: 'keyboard_arrow_up', color: 'text-red-500' },
    { name: 'Medium', icon: 'equal', color: 'text-orange-500' },
    { name: 'Low', icon: 'keyboard_arrow_down', color: 'text-blue-500' },
    { name: 'Lowest', icon: 'keyboard_double_arrow_down', color: 'text-blue-500' }
  ];
  selectedPriority = signal(this.priorities[2]); 

  showAssigneeMenu = signal(false);
  showReporterMenu = signal(false);
  currentUser = signal('Admin'); 
  
  employees = signal<any[]>([]);
  newTask = signal({
    title: '',
    description: '',
    assignee: null as any,
    reporter: 'Admin', 
    priority: 'Medium',
    status: 'To-Do',
    attachments: [] as any[]
  });

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.apiService.getEmployees().subscribe({
      next: (res) => {
        if (res.success) {
          const filtered = res.data.filter((emp: any) => {
            const roleName = emp.role?.name || emp.role;
            return roleName !== 'Admin';
          });
          this.employees.set(filtered);
        }
      }
    });
  }

  openCreateModal(status: string) {
    this.newTask.set({
      title: '',
      description: '',
      assignee: null,
      reporter: this.currentUser(),
      priority: 'Medium',
      status: status,
      attachments: []
    });
    this.showCreateModal.set(true);
  }

  saveTask() {
    const data = this.newTask();
    if (!data.title.trim()) return;

    const lastId = this.tasks().length > 0 
      ? parseInt(this.tasks()[this.tasks().length - 1].id.split('-')[1]) 
      : 0;
    const nextId = `TSK-${String(lastId + 1).padStart(3, '0')}`;

    const task = {
      id: nextId,
      title: data.title,
      description: data.description,
      assignedTo: data.assignee ? `${data.assignee.firstName} ${data.assignee.lastName}` : 'Unassigned',
      avatar: data.assignee?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      priority: data.priority,
      status: data.status,
      date: 'Today'
    };

    this.tasks.set([...this.tasks(), task]);
    this.showCreateModal.set(false);
  }

  openTaskDetail(task: any) {
    this.selectedTask.set({
      ...task,
      key: task.id,
      project: 'Office Management System',
      reporter: task.reporter || 'Admin',
      labels: [],
      sprint: 'Candidate Sprint 6',
      createdDate: new Date().toLocaleDateString(),
      updatedDate: new Date().toLocaleDateString()
    });
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.showDetailStatusMenu.set(false);
    this.selectedTask.set(null);
  }

  updateTaskStatus(taskId: string, newStatus: string) {
    this.tasks.update(tasks => tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    const current = this.selectedTask();
    if (current && current.id === taskId) {
      this.selectedTask.update(prev => ({ ...prev, status: newStatus }));
    }

    this.showDetailStatusMenu.set(false);
  }

  tasksByStatus = computed(() => {
    const groups: { [key: string]: any[] } = {};
    this.tasks().forEach(t => {
      if (!groups[t.status]) groups[t.status] = [];
      groups[t.status].push(t);
    });
    return groups;
  });

  getTasks(status: string) {
    return this.tasksByStatus()[status] || [];
  }

  addColumn() {
    const name = window.prompt('Enter new status/column name:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      this.columns.set([...this.columns(), { name: trimmed, icon: 'view_column' }]);
    }
  }

  createStatus() {
    this.addColumn();
    this.showStatusMenu.set(false);
  }

  formatText(command: string, value: string = '') {
    if (command === 'heading') {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        let parent = selection.anchorNode.parentElement;
        const currentTag = parent?.tagName.toLowerCase();
        const nextTag = currentTag === 'h1' ? 'h2' : currentTag === 'h2' ? 'p' : 'h1';
        document.execCommand('formatBlock', false, `<${nextTag}>`);
      }
    } else if (command === 'createLink') {
      const url = prompt('Enter the link URL:');
      if (url) document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, value);
    }
  }

  updateDescription(event: any) {
    this.newTask.update(prev => ({ ...prev, description: event.target.innerHTML }));
  }

  toggleMenu(menuName: string) {
    const menus: {[key: string]: any} = {
      workType: this.showWorkTypeMenu,
      status: this.showStatusMenu,
      priority: this.showPriorityMenu,
      assignee: this.showAssigneeMenu,
      reporter: this.showReporterMenu,
      more: this.showMoreMenu,
      detailStatus: this.showDetailStatusMenu
    };

    const target = menus[menuName];
    const targetValue = !target();

    // Close all
    Object.values(menus).forEach(m => m.set(false));
    
    // Toggle target
    target.set(targetValue);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      const currentAttachments = this.newTask().attachments || [];
      for (let i = 0; i < files.length; i++) {
        currentAttachments.push({
          file: files[i],
          name: files[i].name,
          type: files[i].type,
          size: (files[i].size / 1024 / 1024).toFixed(2) + ' MB'
        });
      }
      this.newTask.update(prev => ({ ...prev, attachments: currentAttachments }));
    }
  }

  removeAttachment(index: number) {
    const current = this.newTask().attachments;
    current.splice(index, 1);
    this.newTask.update(prev => ({ ...prev, attachments: current }));
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  }
}
