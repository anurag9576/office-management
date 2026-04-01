import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  public notificationRefresh = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Helper to get headers with token
  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================
  // 1. Authentication (Login/Register)
  // ==========================================
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, userData, { headers: this.getHeaders() });
  }

  // ==========================================
  // 2. Employee Management (Profile/Updates)
  // ==========================================
  
  // Get all employees list
  getEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees`, { headers: this.getHeaders() });
  }

  // Get single employee by ID (used for Profile)
  getEmployeeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() });
  }

  // Update employee details (including Profile Photo)
  updateEmployee(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, data, { headers: this.getHeaders() });
  }

  // Get next auto-generated employee ID
  getNextEmployeeId(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/next-id`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 3. Department Management
  // ==========================================
  getDepartments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/departments`, { headers: this.getHeaders() });
  }

  createDepartment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments`, data, { headers: this.getHeaders() });
  }



  // ==========================================
  // 4. Leave Management
  // ==========================================
  
  // Apply for a new leave
  applyLeave(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/leaves`, data, { headers: this.getHeaders() });
  }

  // Get current user's leaves & stats
  getMyLeaves(): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves/my-leaves`, { headers: this.getHeaders() });
  }

  // Get all leaves (Admin view)
  getAllLeaves(): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves`, { headers: this.getHeaders() });
  }

  // Update leave status (Approve/Reject)
  updateLeaveStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/leaves/${id}`, { status }, { headers: this.getHeaders() });
  }

  // Holiday Management
  getHolidays(year?: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/holidays${year ? '?year=' + year : ''}`, { headers: this.getHeaders() });
  }

  addHoliday(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/holidays`, data, { headers: this.getHeaders() });
  }

  deleteHoliday(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/holidays/${id}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 5. Payroll & Payslips
  // ==========================================
  
  getMyPayrolls(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll/my-payrolls`, { headers: this.getHeaders() });
  }

  getAllPayrolls(): Observable<any> {
    return this.http.get(`${this.baseUrl}/payroll`, { headers: this.getHeaders() });
  }

  generatePayroll(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payroll`, data, { headers: this.getHeaders() });
  }

  updatePayroll(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/payroll/${id}`, data, { headers: this.getHeaders() });
  }

  deletePayroll(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/payroll/${id}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 6. Announcements
  // ==========================================
  
  getAnnouncements(): Observable<any> {
    return this.http.get(`${this.baseUrl}/announcements`, { headers: this.getHeaders() });
  }

  createAnnouncement(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/announcements`, data, { headers: this.getHeaders() });
  }

  updateAnnouncement(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/announcements/${id}`, data, { headers: this.getHeaders() });
  }

  deleteAnnouncement(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/announcements/${id}`, { headers: this.getHeaders() });
  }

  toggleLike(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/announcements/${id}/like`, {}, { headers: this.getHeaders() });
  }

  addComment(announcementId: string, text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/announcements/${announcementId}/comments`, { text }, { headers: this.getHeaders() });
  }

  deleteComment(announcementId: string, commentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/announcements/${announcementId}/comments/${commentId}`, { headers: this.getHeaders() });
  }

  toggleFlagComment(announcementId: string, commentId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/announcements/${announcementId}/comments/${commentId}/flag`, {}, { headers: this.getHeaders() });
  }

  votePoll(announcementId: string, optionId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/announcements/${announcementId}/vote`, { optionId }, { headers: this.getHeaders() });
  }

  // ==========================================
  // 7. Notifications
  // ==========================================

  getMyNotifications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/notifications`, { headers: this.getHeaders() });
  }

  markNotificationAsRead(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllNotificationsAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {}, { headers: this.getHeaders() });
  }

  // ==========================================
  // 8. Roles & Permissions
  // ==========================================

  getRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles`, { headers: this.getHeaders() });
  }

  upsertRole(roleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/roles`, roleData, { headers: this.getHeaders() });
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/roles/${id}`, { headers: this.getHeaders() });
  }

  getRolePermissions(roleName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles/${roleName}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 9. Timesheet Management
  // ==========================================

  getMyTimesheets(): Observable<any> {
    return this.http.get(`${this.baseUrl}/timesheets/my`, { headers: this.getHeaders() });
  }

  getAllTimesheets(): Observable<any> {
    return this.http.get(`${this.baseUrl}/timesheets/all`, { headers: this.getHeaders() });
  }

  createTimesheet(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/timesheets`, data, { headers: this.getHeaders() });
  }

  updateTimesheet(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/timesheets/${id}`, data, { headers: this.getHeaders() });
  }

  deleteTimesheet(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/timesheets/${id}`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 10. Password Management
  // ==========================================

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/change-password`, data, { headers: this.getHeaders() });
  }

  // ==========================================
  // 11. Document Management
  // ==========================================

  getDocumentTemplates(): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/templates`, { headers: this.getHeaders() });
  }

  createDocumentTemplate(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/templates`, data, { headers: this.getHeaders() });
  }

  issueDocument(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/issue`, data, { headers: this.getHeaders() });
  }

  getMyDocuments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/my`, { headers: this.getHeaders() });
  }

  getAllIssuedDocuments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/issued-all`, { headers: this.getHeaders() });
  }

  // Document Requests
  requestDocument(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/request`, data, { headers: this.getHeaders() });
  }

  getMyRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/my-requests`, { headers: this.getHeaders() });
  }

  getAllRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/requests-all`, { headers: this.getHeaders() });
  }

  updateRequestStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/documents/request/${id}`, { status }, { headers: this.getHeaders() });
  }

  // ==========================================
  // 12. File Upload (New backend endpoint)
  // ==========================================
  uploadFile(file: File, folder?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }
    
    // For FormData, we must let the browser set the Content-Type with boundary
    const headers = this.getHeaders().delete('Content-Type');
    return this.http.post(`${this.baseUrl}/upload`, formData, { headers });
  }
}
