import { Injectable } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';
import { PricingRule } from '../models/shipment.model';
import { User }        from '../models/user.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(private http: HttpClient) {}

  // ── Dashboard ──────────────────────────────────────────────
  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports/dashboard`);
  }

  getShipmentsReport(filters?: any): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports/shipments`, { params: filters });
  }

  // ── Usuarios ───────────────────────────────────────────────
  getUsers(filters?: any): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/users`, { params: filters });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/users/${id}`);
  }

  getRoles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/users/roles`);
  }

  createUser(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/auth/register`, data);
  }

  // ── Tarifas ────────────────────────────────────────────────
  getPricingRules(): Observable<ApiResponse<PricingRule[]>> {
    return this.http.get<ApiResponse<PricingRule[]>>(`${environment.apiUrl}/pricing`);
  }

  updatePricingRule(id: number, data: Partial<PricingRule>): Observable<ApiResponse<PricingRule>> {
    return this.http.put<ApiResponse<PricingRule>>(`${environment.apiUrl}/pricing/${id}`, data);
  }

  createPricingRule(data: Omit<PricingRule, 'id' | 'isActive'>): Observable<ApiResponse<PricingRule>> {
    return this.http.post<ApiResponse<PricingRule>>(`${environment.apiUrl}/pricing`, data);
  }

  getPricingHistory(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/pricing/${id}/history`);
  }

  addGuides(id: number, amount: number, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/pricing/${id}/add-guides`, { amount, reason });
  }

  getInventoryLogs(id: number): Observable<ApiResponse<any[]>> {
    const t = new Date().getTime();
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/pricing/${id}/inventory-logs?t=${t}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
  }

  // ── Tracking ───────────────────────────────────────────────
  getActiveDriverLocations(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/tracking/repartidores`);
  }
}
