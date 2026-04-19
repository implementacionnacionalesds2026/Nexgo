import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Shipment } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">visibility</span> 
            Detalle del Envío
          </span>
        </div>
        <div class="nx-content">
          <div class="nx-page-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h1>Solicitud de Envío</h1>
              <p>Resumen detallado de la información registrada</p>
            </div>
            <div style="display:flex; gap:1rem;">
              <a routerLink="/cliente/mis-envios" class="nx-btn btn-ghost">← Volver</a>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }
          @if (error) { <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div> }

          @if (!loading && shipment) {
            <div class="layout-grid">
              
              <!-- INFO BAR -->
              <div class="nx-card full-width" style="margin-bottom: 2rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 1.5rem; background: var(--bg-card); border-radius: 12px;">
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Número de Guía</span>
                    <div style="font-size: 1.75rem; font-weight: 800; color:var(--accent); font-family:'Space Grotesk', sans-serif;">{{ shipment.trackingNumber || $any(shipment).tracking_number }}</div>
                  </div>
                  <div style="text-align:right;">
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Estado del Envío</span>
                    <div style="margin-top: 5px;">
                      <span class="status-chip" [attr.data-status]="shipment.currentStatus || $any(shipment).current_status">
                        {{ shipment.currentStatus || $any(shipment).current_status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD 1: REMITENTE -->
              <div class="nx-card">
                <div class="card-header">
                  <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">person</span> Datos del Remitente</h3>
                </div>
                <div class="card-body">
                  <div class="detail-row">
                    <span class="label">Nombre</span>
                    <span class="value">{{ shipment.senderName || $any(shipment).sender_name }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Teléfono</span>
                    <span class="value">{{ shipment.senderPhone || $any(shipment).sender_phone }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Ciudad Origen</span>
                    <span class="value">{{ shipment.originCity || $any(shipment).origin_city }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Dirección</span>
                    <span class="value">{{ shipment.senderAddress || $any(shipment).sender_address }}</span>
                  </div>
                </div>
              </div>

              <!-- CARD 2: DESTINATARIO -->
              <div class="nx-card">
                <div class="card-header">
                  <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> Datos del Destinatario</h3>
                </div>
                <div class="card-body">
                  <div class="detail-row">
                    <span class="label">Nombre</span>
                    <span class="value">{{ shipment.recipientName || $any(shipment).recipient_name }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Teléfono</span>
                    <span class="value">{{ shipment.recipientPhone || $any(shipment).recipient_phone }}</span>
                  </div>
                  <div class="detail-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div>
                      <span class="label">Departamento</span>
                      <span class="value">{{ shipment.recipientDepartment || $any(shipment).recipient_department || '-' }}</span>
                    </div>
                    <div>
                      <span class="label">Municipio</span>
                      <span class="value">{{ shipment.recipientMunicipality || $any(shipment).recipient_municipality || shipment.destinationCity || $any(shipment).destination_city }}</span>
                    </div>
                  </div>
                  <div class="detail-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div>
                      <span class="label">Zona</span>
                      <span class="value">{{ shipment.recipientZone || $any(shipment).recipient_zone || 'S/D' }}</span>
                    </div>
                    <div>
                      <span class="label">Referencia</span>
                      <span class="value">{{ shipment.comments || $any(shipment).comments || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Dirección Exacta</span>
                    <span class="value">{{ shipment.recipientAddress || $any(shipment).recipient_address }}</span>
                  </div>
                </div>
              </div>

              <!-- CARD 3: PAQUETE Y LOGÍSTICA -->
              <div class="nx-card">
                <div class="card-header">
                  <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Paquete y Guía</h3>
                </div>
                <div class="card-body">
                  <div class="detail-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div>
                      <span class="label">Peso (libras)</span>
                      <span class="value">{{ shipment.weightKg || $any(shipment).weight_kg }} lb</span>
                    </div>
                    <div>
                      <span class="label">Piezas</span>
                      <span class="value">{{ shipment.quantity }}</span>
                    </div>
                  </div>
                  <div class="detail-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div>
                      <span class="label">No. Orden</span>
                      <span class="value">{{ shipment.orderNumber || $any(shipment).order_number || '-' }}</span>
                    </div>
                    <div>
                      <span class="label">No. Ticket</span>
                      <span class="value">{{ shipment.ticketNumber || $any(shipment).ticket_number || '-' }}</span>
                    </div>
                  </div>
                  <div class="detail-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                    <div>
                      <span class="label">Código Destino</span>
                      <span class="value badge-black">{{ shipment.destinationCode || $any(shipment).destination_code || 'GUA' }}</span>
                    </div>
                    <div>
                      <span class="label">Servicio</span>
                      <span class="value badge-outline">{{ shipment.serviceTag || $any(shipment).service_tag || 'DOM' }}</span>
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Descripción</span>
                    <span class="value">{{ shipment.description || $any(shipment).description || 'Sin descripción' }}</span>
                  </div>
                </div>
              </div>

              <!-- CARD 4: PAGO -->
              <div class="nx-card">
                <div class="card-header">
                  <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">payments</span> Detalles de Cobro</h3>
                </div>
                <div class="card-body">
                  <div class="detail-row">
                    <span class="label">Monto a Cobrar</span>
                    <span class="value" style="font-size: 1.5rem; color: var(--success); font-weight: 800;">Q {{ shipment.totalPaymentAmount || $any(shipment).total_payment_amount || '0.00' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Instrucciones de Pago</span>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; font-size: 0.9rem; color: #475569; border: 1px solid #e2e8f0;">
                      {{ shipment.paymentInstructions || $any(shipment).payment_instructions || 'Favor cobrar con envío incluido' }}
                    </div>
                  </div>
                  <div class="detail-row" style="margin-top: 2rem;">
                    <span class="label">Frágil</span>
                    <span class="value">
                      @if (shipment.isFragile || $any(shipment).is_fragile) {
                        <span style="color: #ef4444; font-weight: 700;">⚠ SÍ (Manejo Especial)</span>
                      } @else {
                        No
                      }
                    </span>
                  </div>
                </div>
              </div>

            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 20px;
    }
    .full-width { grid-column: 1 / -1; }
    
    .nx-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(79, 70, 229, 0.08);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      transition: transform var(--tr);
    }
    .nx-card:hover { transform: translateY(-4px); }

    .card-header { 
      padding: 1rem 1.5rem; 
      background: rgba(79, 70, 229, 0.04); 
      border-bottom: 1px solid rgba(79, 70, 229, 0.08); 
    }
    .card-header h3 { margin: 0; font-size: 1rem; color: #080C28; display: flex; align-items: center; gap: 8px; font-weight: 800; }
    .card-body { padding: 1.5rem; }

    .detail-row { margin-bottom: 1.25rem; }
    .detail-row:last-child { margin-bottom: 0; }
    .label { display: block; font-size: 0.72rem; color: #0F2141; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .value { display: block; font-size: 1.05rem; color: var(--text-dark); font-weight: 600; }

    .status-chip {
      padding: 6px 16px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
    }
    .status-chip[data-status="PENDIENTE"] { background: #fef3c7; color: #92400e; }
    .status-chip[data-status="EN_TRANSITO"] { background: #dbeafe; color: #1e40af; }
    .status-chip[data-status="ENTREGADO"] { background: #dcfce7; color: #166534; }

    .badge-black { background: var(--text-dark); color: white; padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 900; }
    .badge-outline { border: 2px solid var(--text-dark); padding: 2px 10px; border-radius: var(--radius-sm); font-weight: 900; }

    @media (max-width: 768px) {
      .layout-grid { grid-template-columns: 1fr; }
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
  ) { }

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
          this.error = 'No se pudo cargar la solicitud.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se proporcionó un ID válido';
    }
  }
}
