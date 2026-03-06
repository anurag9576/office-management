import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leaves-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaves-admin.html',
  styleUrl: './leaves-admin.css'
})
export class LeavesAdmin {
  leaveRequests = signal([
    { name: 'Anurag Kumar', type: 'Sick Leave', duration: '2 Days', status: 'Pending' },
    { name: 'Amit Singh', type: 'Casual Leave', duration: '1 Day', status: 'Approved' }
  ]);

  approveLeave(index: number) {
    this.leaveRequests.update(requests => {
      requests[index].status = 'Approved';
      return [...requests];
    });
  }

  rejectLeave(index: number) {
    this.leaveRequests.update(requests => {
      requests[index].status = 'Rejected';
      return [...requests];
    });
  }
}
