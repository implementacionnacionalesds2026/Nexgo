import { Injectable }    from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }   from 'rxjs';
import { environment }  from '../../../environments/environment';
import { Shipment, CreateShipmentRequest, CotizacionResult } from '../models/shipment.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ShipmentService {

  private url = `${environment.apiUrl}/shipments`;
  private cotizarUrl = `${environment.apiUrl}/cotizar`;

  constructor(private http: HttpClient) {}

  getShipments(filters?: { status?: string; page?: number; limit?: number }): Observable<ApiResponse<PaginatedResponse<Shipment>>> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page)   params = params.set('page', filters.page.toString());
    if (filters?.limit)  params = params.set('limit', filters.limit.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Shipment>>>(this.url, { params });
  }

  getShipmentById(id: string): Observable<ApiResponse<Shipment>> {
    return this.http.get<ApiResponse<Shipment>>(`${this.url}/${id}`);
  }

  createShipment(data: CreateShipmentRequest): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(this.url, data);
  }

  updateStatus(id: string, status: string, notes?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.url}/${id}/status`, { status, notes });
  }

  assignDriver(shipmentId: string, driverId: string): Observable<ApiResponse<Shipment>> {
    return this.http.put<ApiResponse<Shipment>>(`${this.url}/${shipmentId}/assign`, { driverId });
  }

  cotizar(data: { weightKg: number; distanceKm: number; quantity?: number; lengthCm?: number; widthCm?: number; heightCm?: number }): Observable<ApiResponse<{ cotizaciones: CotizacionResult[] }>> {
    return this.http.post<ApiResponse<{ cotizaciones: CotizacionResult[] }>>(this.cotizarUrl, data);
  }
}
