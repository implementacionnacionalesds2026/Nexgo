import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { Shipment }            from '../../../core/models/shipment.model';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">👁️ Ver Solicitud</span></div>
        <div class="nx-content">
          <div class="nx-page-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h1>Detalle de la Solicitud</h1>
              <p>Formulario de envío original (Solo Lectura)</p>
            </div>
            <a routerLink="/cliente/mis-envios" class="nx-btn btn-ghost">← Volver a Mis Envíos</a>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }
          @if (error) { <div class="nx-alert alert-error">⚠️ {{ error }}</div> }

          @if (!loading && shipment) {
            <div class="nx-card">
              <!-- Tracking info header -->
              <div style="background:var(--bg-lighter); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Guía No.</span><br>
                  <strong style="font-size: 1.25rem; color:var(--accent); font-family: monospace;">{{ shipment.trackingNumber || $any(shipment).tracking_number }}</strong>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase;">Estado Actual</span><br>
                  <strong style="font-size: 1rem;">{{ shipment.currentStatus || $any(shipment).current_status }}</strong>
                </div>
              </div>

              <!-- Remitente -->
              <div class="card-header"><h3>📍 Datos del Remitente</h3></div>
              <div class="nx-form-row cols-2">
                <div class="nx-form-group">
                  <label>Nombre del remitente</label>
                  <input class="nx-input" [value]="shipment.senderName || $any(shipment).sender_name" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Teléfono</label>
                  <input class="nx-input" [value]="shipment.senderPhone || $any(shipment).sender_phone" disabled />
                </div>
              </div>
              <div class="nx-form-group">
                <label>Dirección de origen</label>
                <input class="nx-input" [value]="shipment.senderAddress || $any(shipment).sender_address" disabled />
              </div>
              <div class="nx-form-group">
                <label>Ciudad de origen</label>
                <input class="nx-input" [value]="shipment.originCity || $any(shipment).origin_city" disabled />
              </div>

              <div style="margin: 2rem 0; border-top: 1px solid var(--border);"></div>

              <!-- Destinatario -->
              <div class="card-header"><h3>📫 Datos del Destinatario</h3></div>
              <div class="nx-form-row cols-2">
                <div class="nx-form-group">
                  <label>Nombre del destinatario</label>
                  <input class="nx-input" [value]="shipment.recipientName || $any(shipment).recipient_name" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Teléfono</label>
                  <input class="nx-input" [value]="shipment.recipientPhone || $any(shipment).recipient_phone" disabled />
                </div>
              </div>
              <div class="nx-form-group">
                <label>Dirección de destino</label>
                <input class="nx-input" [value]="shipment.recipientAddress || $any(shipment).recipient_address" disabled />
              </div>
              <div class="nx-form-group">
                <label>Ciudad de destino</label>
                <input class="nx-input" [value]="shipment.destinationCity || $any(shipment).destination_city" disabled />
              </div>

              <div style="margin: 2rem 0; border-top: 1px solid var(--border);"></div>

              <!-- Paquete -->
              <div class="card-header"><h3>📦 Información del Paquete</h3></div>
              <div class="nx-form-row cols-2">
                <div class="nx-form-group">
                  <label>Peso (kg)</label>
                  <input class="nx-input" [value]="shipment.weightKg || $any(shipment).weight_kg" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Cantidad de paquetes</label>
                  <input class="nx-input" [value]="shipment.quantity" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Largo (cm)</label>
                  <input class="nx-input" [value]="shipment.lengthCm || $any(shipment).length_cm || '-'" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Ancho (cm)</label>
                  <input class="nx-input" [value]="shipment.widthCm || $any(shipment).width_cm || '-'" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Alto (cm)</label>
                  <input class="nx-input" [value]="shipment.heightCm || $any(shipment).height_cm || '-'" disabled />
                </div>
                <div class="nx-form-group">
                  <label>Distancia (km)</label>
                  <input class="nx-input" [value]="shipment.distanceKm || $any(shipment).distance_km || '-'" disabled />
                </div>
              </div>
              <div class="nx-form-group">
                <label>Descripción del contenido</label>
                <input class="nx-input" [value]="shipment.description || 'Sin descripción'" disabled />
              </div>
              <div style="display:flex;align-items:center;gap:.75rem; margin-top: 1rem;">
                <input type="checkbox" [checked]="shipment.isFragile || $any(shipment).is_fragile" disabled style="width:16px;height:16px;accent-color:var(--accent);" />
                <label style="font-size:.875rem; color: var(--text-muted);">🫧 Paquete frágil (manejo especial)</label>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      color: var(--text-muted);
    }
    input[type="checkbox"]:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class VerSolicitudComponent implements OnInit {
  shipment: Shipment | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private shipmentService: ShipmentService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.shipmentService.getShipmentById(id).subscribe({
        next: (r) => {
          this.shipment = r.data;
          this.loading = false;
        },
        error: (e) => {
          console.error(e);
          this.error = 'No se pudo cargar la solicitud. Detalles: ' + (e.message || JSON.stringify(e));
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se proporcionó un ID válido';
      this.loading = false;
    }
  }
}
