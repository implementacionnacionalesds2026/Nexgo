import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { AdminService }    from '../../../core/services/admin.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Subscription }    from 'rxjs';

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">map</span> Rastreo en Tiempo Real</span>
          <div class="navbar-right">
            <span style="display:flex;align-items:center;gap:.5rem;font-size:.8rem;color:var(--accent);">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);animation:spin .8s linear infinite;display:inline-block;"></span>
              Live
            </span>
          </div>
        </div>

        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Monitoreo de Repartidores</h1>
            <p>Ubicación GPS en tiempo real de todos los repartidores activos</p>
          </div>

          <div class="nx-grid cols-2" style="align-items:start;">
            <!-- Mapa -->
            <div class="nx-card" style="padding:0;overflow:hidden;aspect-ratio:1;">
              <div id="nexgo-map" style="width:100%;height:100%;min-height:450px;background:linear-gradient(135deg,#060919,#0d1440);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;">
                <div style="font-size:3rem;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">map</span></div>
                <div style="color:var(--text-muted);text-align:center;">
                  <div style="font-weight:600;margin-bottom:.35rem;">Google Maps</div>
                  <div style="font-size:.8rem;">Configura tu API Key en environment.ts</div>
                  <div style="font-size:.75rem;margin-top:.5rem;color:var(--accent);">
                    googleMapsApiKey: 'YOUR_KEY'
                  </div>
                </div>
              </div>
            </div>

            <!-- Lista de repartidores -->
            <div>
              <div class="nx-card">
                <div class="card-header">
                  <h3>Repartidores Activos ({{ drivers.length }})</h3>
                  <button class="nx-btn btn-ghost btn-sm" (click)="loadDrivers()">🔄 Actualizar</button>
                </div>
                @if (loadingDrivers) {
                  <div class="nx-loader" style="padding:2rem;"><div class="spinner"></div></div>
                }
                @for (d of drivers; track d.driver_id) {
                  <div style="display:flex;align-items:center;gap:1rem;padding:.75rem;border-radius:var(--radius-sm);background:var(--bg-card);margin-bottom:.5rem;border:1px solid var(--border);">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
                      {{ d.driver_name?.charAt(0) }}
                    </div>
                    <div style="flex:1;">
                      <div style="font-weight:600;font-size:.875rem;">{{ d.driver_name }}</div>
                      <div style="font-size:.75rem;color:var(--text-muted);">{{ d.tracking_number || 'Sin guía asignada' }}</div>
                      <div style="font-size:.75rem;color:var(--accent);">{{ d.destination_city }}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                      <div style="font-size:.72rem;color:var(--text-muted);">{{ d.latitude?.toFixed(4) }}, {{ d.longitude?.toFixed(4) }}</div>
                      @if (d.speed_kmh) {
                        <div style="font-size:.72rem;color:var(--status-transit);">🚗 {{ d.speed_kmh }} km/h</div>
                      }
                    </div>
                  </div>
                }
                @if (!loadingDrivers && drivers.length === 0) {
                  <div class="nx-empty" style="padding:2rem;">
                    <div class="empty-icon">🏍️</div>
                    <h3>Sin repartidores activos</h3>
                    <p style="font-size:.83rem;">No hay repartidores con ubicación en los últimos 60 minutos</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class RastreoComponent implements OnInit, OnDestroy {

  drivers: any[] = [];
  loadingDrivers = true;
  private sub?: Subscription;

  constructor(
    private adminService: AdminService,
    private trackingService: TrackingService,
  ) {}

  ngOnInit() {
    this.loadDrivers();
    this.trackingService.connect();
    this.sub = this.trackingService.onLocationUpdate().subscribe((data) => {
      const idx = this.drivers.findIndex((d) => d.driver_id === data.driverId);
      if (idx > -1) {
        this.drivers[idx].latitude  = data.latitude;
        this.drivers[idx].longitude = data.longitude;
      } else {
        this.loadDrivers();
      }
    });
  }

  loadDrivers() {
    this.loadingDrivers = true;
    this.adminService.getActiveDriverLocations().subscribe({
      next: (r) => { this.drivers = r.data; this.loadingDrivers = false; },
      error: ()  => { this.loadingDrivers = false; },
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
