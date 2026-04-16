import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket }            from 'socket.io-client';
import { Observable }            from 'rxjs';
import { environment }           from '../../../environments/environment';
import { AuthService }           from './auth.service';

@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {

  private socket!: Socket;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      const user = this.authService.currentUser();
      if (user) {
        this.socket.emit('join:role', { role: user.role, userId: user.id });
      }
    });
  }

  disconnect(): void {
    if (this.socket) this.socket.disconnect();
  }

  // Escuchar ubicaciones de repartidores (ADMIN)
  onLocationUpdate(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('tracking:location_update', (data) => observer.next(data));
    });
  }

  // Escuchar cambios de estado de un envío
  onShipmentStatusChange(shipmentId: string): Observable<any> {
    this.socket.emit('subscribe:shipment', shipmentId);
    return new Observable((observer) => {
      this.socket.on(`shipment:${shipmentId}:status`, (data) => observer.next(data));
    });
  }

  // Enviar ubicación GPS (REPARTIDOR)
  sendLocation(latitude: number, longitude: number, shipmentId?: string): void {
    // El envío de ubicación va por HTTP (más confiable), Socket.io solo recibe
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
