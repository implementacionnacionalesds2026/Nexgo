import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">map</span>
            Rastreo en Tiempo Real
          </span>
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
              <div
                id="nexgo-map"
                style="width:100%;height:100%;min-height:450px;background:#0b1025;"
              ></div>
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
                  <div
                    style="display:flex;align-items:center;gap:1rem;padding:.75rem;border-radius:var(--radius-sm);background:var(--bg-card);margin-bottom:.5rem;border:1px solid var(--border);cursor:pointer;"
                    (click)="focusDriver(d)"
                  >
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
                      {{ d.driver_name?.charAt(0) }}
                    </div>

                    <div style="flex:1;">
                      <div style="font-weight:600;font-size:.875rem;">{{ d.driver_name }}</div>
                      <div style="font-size:.75rem;color:var(--text-muted);">{{ d.tracking_number || 'Sin guía asignada' }}</div>
                      <div style="font-size:.75rem;color:var(--accent);">{{ d.destination_city || 'Sin destino' }}</div>
                    </div>

                    <div style="text-align:right;flex-shrink:0;">
                      <div style="font-size:.72rem;color:var(--text-muted);">
                        {{ d.latitude?.toFixed(4) }}, {{ d.longitude?.toFixed(4) }}
                      </div>
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
export class RastreoComponent implements OnInit, OnDestroy, AfterViewInit {
  drivers: any[] = [];
  loadingDrivers = true;
  private sub?: Subscription;

  private map!: L.Map;
  private markers: Record<string, L.Marker> = {};
  private mapReady = false;

  constructor(
    private adminService: AdminService,
    private trackingService: TrackingService,
  ) { }

  ngOnInit() {
    this.loadDrivers();

    this.trackingService.connect();
    this.sub = this.trackingService.onLocationUpdate().subscribe((data) => {
      const idx = this.drivers.findIndex((d) => d.driver_id === data.driverId);

      if (idx > -1) {
        this.drivers[idx].latitude = data.latitude;
        this.drivers[idx].longitude = data.longitude;
        this.updateDriverMarker(this.drivers[idx]);
      } else {
        this.loadDrivers();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.renderMarkers();
    }, 100);
  }

  initMap() {
    if (this.mapReady) return;

    this.map = L.map('nexgo-map').setView([14.6349, -90.5069], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.mapReady = true;

    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  loadDrivers() {
    this.loadingDrivers = true;

    this.adminService.getActiveDriverLocations().subscribe({
      next: (r) => {
        this.drivers = r.data || [];
        this.loadingDrivers = false;
        this.renderMarkers();
      },
      error: () => {
        this.loadingDrivers = false;
      },
    });
  }

  renderMarkers() {
    if (!this.mapReady) return;

    Object.values(this.markers).forEach((marker) => this.map.removeLayer(marker));
    this.markers = {};

    const validDrivers = this.drivers.filter(
      (d) =>
        d.latitude !== null &&
        d.latitude !== undefined &&
        d.longitude !== null &&
        d.longitude !== undefined
    );

    validDrivers.forEach((driver) => {
      this.createDriverMarker(driver);
    });

    if (validDrivers.length > 0) {
      const bounds = L.latLngBounds(
        validDrivers.map((d) => [d.latitude, d.longitude] as [number, number])
      );
      this.map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      this.map.setView([14.6349, -90.5069], 7);
    }

    setTimeout(() => this.map.invalidateSize(), 100);
  }

  createDriverMarker(driver: any) {
    if (!this.mapReady || !driver.latitude || !driver.longitude) return;

    const marker = L.marker([driver.latitude, driver.longitude])
      .addTo(this.map)
      .bindPopup(`
        <div style="min-width:180px;">
          <strong>${driver.driver_name || 'Repartidor'}</strong><br>
          <small>${driver.tracking_number || 'Sin guía asignada'}</small><br>
          <small>${driver.destination_city || 'Sin destino'}</small><br>
          <small>Lat: ${driver.latitude}</small><br>
          <small>Lng: ${driver.longitude}</small>
        </div>
      `);

    this.markers[driver.driver_id] = marker;
  }

  updateDriverMarker(driver: any) {
    if (!this.mapReady || !driver?.driver_id || !driver.latitude || !driver.longitude) return;

    const existingMarker = this.markers[driver.driver_id];

    if (existingMarker) {
      existingMarker.setLatLng([driver.latitude, driver.longitude]);
      existingMarker.setPopupContent(`
        <div style="min-width:180px;">
          <strong>${driver.driver_name || 'Repartidor'}</strong><br>
          <small>${driver.tracking_number || 'Sin guía asignada'}</small><br>
          <small>${driver.destination_city || 'Sin destino'}</small><br>
          <small>Lat: ${driver.latitude}</small><br>
          <small>Lng: ${driver.longitude}</small>
        </div>
      `);
    } else {
      this.createDriverMarker(driver);
    }
  }

  focusDriver(driver: any) {
    if (!this.mapReady || !driver?.latitude || !driver?.longitude) return;

    this.map.setView([driver.latitude, driver.longitude], 15);

    const marker = this.markers[driver.driver_id];
    if (marker) {
      marker.openPopup();
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }
}