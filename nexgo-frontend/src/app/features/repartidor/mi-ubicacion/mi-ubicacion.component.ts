import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { HttpClient }     from '@angular/common/http';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService }    from '../../../core/services/auth.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { environment }    from '../../../../environments/environment';

@Component({
  selector: 'app-mi-ubicacion',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> Mi Ubicación</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Reportar Ubicación GPS</h1>
            <p>Tu ubicación se comparte en tiempo real con el equipo de administración</p>
          </div>

          <div class="nx-grid cols-2" style="align-items:start;">
            <div class="nx-card" style="text-align:center;">
              <div style="font-size:4rem;margin-bottom:1rem;">
                @if (isTracking) {
                  <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span>
                } @else {
                  <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">error</span>
                }
              </div>
              <h3 style="font-family:'Space Grotesk',sans-serif;font-size:1.25rem;margin-bottom:.5rem;">
                {{ isTracking ? 'Rastreo activo' : 'Rastreo detenido' }}
              </h3>

              @if (currentLocation) {
                <div style="margin:1rem 0;padding:1rem;background:var(--bg-card);border-radius:var(--radius-sm);font-size:.875rem;">
                  <div style="color:var(--text-muted);margin-bottom:.25rem;">Coordenadas actuales</div>
                  <div class="font-mono" style="color:var(--accent);">
                    {{ currentLocation.latitude.toFixed(6) }}, {{ currentLocation.longitude.toFixed(6) }}
                  </div>
                  @if (currentLocation.accuracy) {
                    <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem;">Precisión: ±{{ currentLocation.accuracy | number:'1.0-0' }} m</div>
                  }
                </div>
              }

              @if (error) { <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div> }
              @if (lastSent) { <div class="nx-alert alert-success" style="text-align:left;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span> Ubicación enviada: {{ lastSent }}</div> }

              <div style="display:flex;gap:.75rem;justify-content:center;margin-top:1rem;">
                @if (!isTracking) {
                  <button class="nx-btn btn-accent btn-lg" (click)="startTracking()">
                    <span class="material-symbols-outlined">satellite_alt</span> Iniciar rastreo GPS
                  </button>
                } @else {
                  <button class="nx-btn btn-danger" (click)="stopTracking()">
                    <span class="material-symbols-outlined">stop_circle</span> Detener rastreo
                  </button>
                  <button class="nx-btn btn-ghost" (click)="sendOnce()"><span class="material-symbols-outlined">sensors</span> Enviar ahora</button>
                }
              </div>

              <p style="font-size:.75rem;color:var(--text-muted);margin-top:1rem;">
                La ubicación se actualiza automáticamente cada 30 segundos mientras el rastreo esté activo.
              </p>
            </div>

            <!-- Info privacidad -->
            <div class="nx-card">
              <div class="card-header"><h3><span class="material-symbols-outlined">info</span> Sobre el rastreo</h3></div>
              <div style="display:flex;flex-direction:column;gap:.75rem;">
                <div style="display:flex;gap:.75rem;align-items:flex-start;">
                  <span style="font-size:1.25rem;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">lock</span></span>
                  <div><div style="font-weight:600;font-size:.875rem;">Privacidad</div><div style="font-size:.8rem;color:var(--text-muted);">Tu ubicación solo es visible para administradores de Nexgo mientras el rastreo esté activo.</div></div>
                </div>
                <div style="display:flex;gap:.75rem;align-items:flex-start;">
                  <span style="font-size:1.25rem;"><span class="material-symbols-outlined">public</span></span>
                  <div><div style="font-weight:600;font-size:.875rem;">GPS del dispositivo</div><div style="font-size:.8rem;color:var(--text-muted);">Usa el GPS de tu teléfono. Asegúrate de tener el servicio habilitado.</div></div>
                </div>
                <div style="display:flex;gap:.75rem;align-items:flex-start;">
                  <span style="font-size:1.25rem;"><span class="material-symbols-outlined">bolt</span></span>
                  <div><div style="font-weight:600;font-size:.875rem;">Auto-envío</div><div style="font-size:.8rem;color:var(--text-muted);">Cada 30 segundos tu posición se envía al servidor automáticamente.</div></div>
                </div>
                <div style="display:flex;gap:.75rem;align-items:flex-start;">
                  <span style="font-size:1.25rem;"><span class="material-symbols-outlined">smartphone</span></span>
                  <div><div style="font-weight:600;font-size:.875rem;">Mantén la app abierta</div><div style="font-size:.8rem;color:var(--text-muted);">El rastreo se pausará si cierras el navegador o la pantalla se apaga.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class MiUbicacionComponent implements OnDestroy {

  isTracking    = false;
  currentLocation: { latitude: number; longitude: number; accuracy?: number } | null = null;
  error  = '';
  lastSent = '';
  private watchId?: number;
  private intervalId?: any;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  startTracking() {
    if (!navigator.geolocation) {
      this.error = 'Tu dispositivo no soporta geolocalización';
      return;
    }

    this.error = '';
    this.isTracking = true;

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(
      (pos) => { this.currentLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }; this.sendLocation(); },
      (err) => { this.error = `Error GPS: ${err.message}`; this.isTracking = false; }
    );

    // Watch para actualizaciones continuas
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => { this.currentLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }; },
      (err) => { this.error = `Error GPS: ${err.message}`; }
    );

    // Enviar cada 30 segundos
    this.intervalId = setInterval(() => {
      if (this.currentLocation) this.sendLocation();
    }, 30000);
  }

  stopTracking() {
    this.isTracking = false;
    if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
    clearInterval(this.intervalId);
  }

  sendOnce() {
    if (this.currentLocation) this.sendLocation();
  }

  private sendLocation() {
    if (!this.currentLocation) return;
    this.http.post(`${environment.apiUrl}/tracking/ubicacion`, {
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
    }).subscribe({
      next: () => { this.lastSent = new Date().toLocaleTimeString('es-GT'); },
      error: () => { this.error = 'Error al enviar ubicación al servidor'; },
    });
  }

  ngOnDestroy() { this.stopTracking(); }
}
