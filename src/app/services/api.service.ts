import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

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

  // Delete an employee
  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() });
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
  // 5. Attendance (Check-in/Out)
  // ==========================================
  checkIn(): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/check-in`, {}, { headers: this.getHeaders() });
  }

  checkOut(): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance/check-out`, {}, { headers: this.getHeaders() });
  }

  getAttendanceReports(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/reports`, { headers: this.getHeaders() });
  }

  // ==========================================
  // 6. Leave Management
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

  // ==========================================
  // 7. Payroll & Payslips
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
  // 8. Announcements
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
  // 9. Notifications
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
  // 10. Roles & Permissions
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
}
