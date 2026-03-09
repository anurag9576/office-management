import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Helper to get headers with token
  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // --- Auth Endpoints ---
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, userData, { headers: this.getHeaders() });
  }

  // --- Employee Endpoints ---
  getEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees`, { headers: this.getHeaders() });
  }

  getEmployeeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() });
  }

  updateEmployee(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, data, { headers: this.getHeaders() });
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`, { headers: this.getHeaders() });
  }

  // --- Department Endpoints ---
  getDepartments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/departments`, { headers: this.getHeaders() });
  }

  createDepartment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments`, data, { headers: this.getHeaders() });
  }

  // --- Announcement Endpoints ---
  getAnnouncements(): Observable<any> {
    return this.http.get(`${this.baseUrl}/announcements`, { headers: this.getHeaders() });
  }

  createAnnouncement(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/announcements`, data, { headers: this.getHeaders() });
  }

  toggleLike(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/announcements/${id}/like`, {}, { headers: this.getHeaders() });
  }

  // --- Attendance Endpoints ---
  checkIn(): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/check-in`, {}, { headers: this.getHeaders() });
  }

  checkOut(): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance/check-out`, {}, { headers: this.getHeaders() });
  }

  getAttendanceReports(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/reports`, { headers: this.getHeaders() });
  }

  // --- Leave Endpoints ---
  applyLeave(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/leaves`, data, { headers: this.getHeaders() });
  }

  getMyLeaves(): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves/my-leaves`, { headers: this.getHeaders() });
  }

  getAllLeaves(): Observable<any> {
    return this.http.get(`${this.baseUrl}/leaves`, { headers: this.getHeaders() });
  }

  updateLeaveStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/leaves/${id}`, { status }, { headers: this.getHeaders() });
  }
}
