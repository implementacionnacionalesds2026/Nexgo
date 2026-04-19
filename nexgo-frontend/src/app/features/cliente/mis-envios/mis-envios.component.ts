import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-mis-envios',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">📦 Mis Envíos</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Historial de Envíos</h1>
            <p>Todos tus envíos registrados en Nexgo</p>
            <div class="header-actions">
              <a routerLink="/cliente/nuevo-envio" class="nx-btn btn-accent">📮 Nuevo envío</a>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <!-- Stats row -->
            <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
              <div class="nx-kpi-card">
                <div class="kpi-icon">📦</div>
                <div class="kpi-label">Total envíos</div>
                <div class="kpi-value">{{ total }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">🟡</div>
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">🚚</div>
                <div class="kpi-label">En tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">✅</div>
                <div class="kpi-label">Entregados</div>
                <div class="kpi-value" style="color:var(--status-delivered);">{{ countByStatus('ENTREGADO') }}</div>
              </div>
            </div>

            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead><tr>
                    <th>Guía</th><th>Fecha</th><th>Origen → Destino</th><th>Peso</th><th>Costo est.</th><th>Estado</th><th style="min-width: 200px;">Acciones</th>
                  </tr></thead>
                  <tbody>
                    @for (s of shipments; track s.id) {
                      <tr>
                        <td class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</td>
                        <td style="font-size:.8rem;">{{ s.created_at | date:'dd/MM/yy' }}</td>
                        <td style="font-size:.83rem;">{{ s.origin_city }} → {{ s.destination_city }}</td>
                        <td style="font-size:.83rem;">{{ s.weight_kg }} kg</td>
                        <td style="font-size:.83rem;font-weight:600;color:var(--accent);">Q{{ s.estimated_cost }}</td>
                        <td><app-status-badge [status]="s.current_status" /></td>
                        <td>
                          <!-- Dropdown Acciones -->
                          <div class="dropdown-container" style="position:relative; display:inline-block;">
                            <button (click)="toggleDropdown(s.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                            <div class="dropdown-menu" [style.display]="openDropdownId === s.id ? 'block' : 'none'">
                              <a [routerLink]="['/cliente/ver-solicitud', s.id]" class="dropdown-item">👁️ Ver Solicitud</a>
                              <a (click)="imprimirGuia(s)" class="dropdown-item">🖨️ Imprimir Guía</a>
                              <a (click)="imprimirFormulario(s)" class="dropdown-item">📄 Formulario</a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (shipments.length === 0) {
                      <tr><td colspan="7">
                        <div class="nx-empty">
                          <div class="empty-icon">📭</div>
                          <h3>Sin envíos aún</h3>
                          <p><a routerLink="/cliente/nuevo-envio" style="color:var(--accent)">Registra tu primer envío</a></p>
                        </div>
                      </td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </main>
    </div>

    <!-- ZONA IMPRESIÓN GUÍA -->
    @if (printMode === 'guia' && printShipment) {
      <div class="print-container">
        <div style="display: flex; justify-content: center; align-items: flex-start; padding: 5mm; height: 100vh;">
          <div>
            <div class="guia-box">
              <!-- Row 1: Remitente -->
              <div class="g-row" style="flex:1;">
                <div class="v-text-dark">Remitente</div>
                <div style="flex:1; display:flex; justify-content:space-between; align-items:flex-start; padding: 4px 8px;">
                  <div>
                    <div style="font-size:16px;"><b>Nombre: </b>{{ printShipment.sender_name || printShipment.senderName | slice:0:30 }}</div>
                    <div style="font-size:14px; margin-top:2px;">Tel. {{ printShipment.sender_phone || printShipment.senderPhone }}</div>
                  </div>
                  <div style="display:flex; align-items:center;">
                    <div style="font-size:32px; line-height:1; margin-right: 14px;">📦</div>
                    <div style="text-align:center; font-size:10px;">
                      <b style="font-size:14px;letter-spacing:-0.5px;">Nacionales</b><br>
                      Delivery Services<br>
                      <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:9px;">
                        <div>4<br>No. Orden</div>
                        <div>4<br>No. Ticket</div>
                      </div>
                    </div>
                    <div style="font-size:18px; font-weight:900; margin-left:8px;">GT</div>
                  </div>
                </div>
              </div>

              <!-- Row 2: Destinatario -->
              <div class="g-row" style="flex:1.2;">
                <div class="v-text-dark">Destinatario</div>
                <div style="flex:1; display:flex; justify-content:space-between; align-items:center; padding: 4px 8px;">
                  <div style="font-size: 13px; line-height: 1.1;">
                    <div style="font-size:15px; margin-bottom:2px;"><b>Nombre: </b>{{ printShipment.recipient_name || printShipment.recipientName | slice:0:35 }}</div>
                    Tel: {{ printShipment.recipient_phone || printShipment.recipientPhone }}<br>
                    Dirección: {{ printShipment.recipient_address || printShipment.recipientAddress | slice:0:60 }},<br>
                    {{ printShipment.destination_city || printShipment.destinationCity }}, Guatemala Guatemala<br>
                    Favor Cobrar Q0.00 con envío incluido
                  </div>
                  <div style="border: 2px solid black; font-weight:800; font-size:24px; padding: 6px 10px; margin-left: 8px;">
                    DOM
                  </div>
                </div>
              </div>

              <!-- Row 3: Codes -->
              <div class="g-row" style="flex:2;">
                <div class="v-text-light">Guía No.<br>{{ printShipment.tracking_number || printShipment.trackingNumber || 'ND0000000' }}</div>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; padding: 8px; position:relative;">
                  <div style="display:flex; align-items:flex-start; gap: 10px; margin-top:10px;">
                    <div style="border:3px solid black; font-size:52px; font-weight:900; padding:4px 12px; letter-spacing:-2px;">GUA</div>
                    <div style="font-size:14px; font-weight:700; line-height:1.1; margin-top:6px;">
                      GT-004:<br>paquete<br>pequeño
                    </div>
                  </div>
                  <div style="align-self:flex-end;">
                    <div style="border:2px solid black; padding: 2px 8px; text-align:center; font-size:10px; font-weight:bold;">
                      Forma Pago<br><span style="font-size:18px; line-height:1;">COLLECT</span>
                    </div>
                  </div>
                </div>
                <div style="width:75px; border-left:2px solid black; display:flex; flex-direction:column;">
                  <div style="flex:1; border-bottom:2px solid black; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">
                    PIEZA<br><b style="font-size:24px; line-height:1.1;">01</b>DE<br><b style="font-size:20px; line-height:1;">{{ printShipment.quantity | number:'2.0' }}</b>
                  </div>
                  <div style="flex:1; border-bottom:2px solid black; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">
                    PESO lb<br><b style="font-size:24px; line-height:1.1;">{{ printShipment.weight_kg || printShipment.weightKg }}</b>DE<br><b style="font-size:20px; line-height:1;">999</b>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 2px; font-size:10px; font-weight:bold; height:34px;">
                    Servicio<br><b style="font-size:16px;">COD</b>
                  </div>
                </div>
              </div>

              <!-- Row 4: Bottom -->
              <div style="background:black; color:white; display:flex; height: 32px; align-items:center; flex-shrink: 0;">
                <div style="flex:1; display:flex; flex-direction:column; align-items:flex-start; padding-left: 8px;">
                  <b style="font-size:20px; line-height:1; letter-spacing:1px;">QTZ</b>
                  <span style="font-size:7px;">Departamento</span>
                </div>
                <div style="flex:2; display:flex; flex-direction:column; align-items:center;">
                  <b style="font-size:20px; line-height:1;">Xela</b>
                  <span style="font-size:7px;">Municipio</span>
                </div>
                <div style="width:30px; display:flex; flex-direction:column; align-items:center; border-left: 2px solid white; margin-right: 15px;">
                  <b style="font-size:20px; line-height:1;">3</b>
                  <span style="font-size:7px;">Zona</span>
                </div>
              </div>
            </div>
            <div style="font-size:9px; text-align:center; padding-top: 4px; font-family: sans-serif; color: black; font-weight: 500;">
              ** Guía sujeta a términos y condiciones **
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ZONA IMPRESIÓN FORMULARIO -->
    @if (printMode === 'formulario' && printShipment) {
      <div class="print-container">
        <div style="padding: 2cm; font-family: 'Helvetica', Arial, sans-serif; max-width: 800px; margin: 0 auto; color: black;">
          <div style="text-align:center; margin-bottom: 2rem; border-bottom: 2px solid #070b24; padding-bottom: 1rem;">
            <h1 style="margin:0; font-size: 28px; color: #070b24;">📦 Nacionales Delivery Services</h1>
            <p style="margin:5px 0 0 0; color: #444; font-size: 16px;">Formulario Detallado de Envío</p>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom: 2rem;">
            <div>
              <b style="color:#070b24;">Número de Guía:</b> {{ printShipment.tracking_number || printShipment.trackingNumber }}<br>
              <b style="color:#070b24;">Fecha:</b> {{ today | date:'dd/MM/yyyy' }}
            </div>
            <div style="text-align:right;">
              <b style="color:#070b24;">Estado:</b> {{ printShipment.current_status || printShipment.currentStatus }}<br>
              <b style="color:#070b24;">Servicio:</b> Envío Nacional Prio
            </div>
          </div>

          <div style="display:flex; gap: 2rem; margin-bottom: 2rem;">
            <div style="flex:1; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;">📍 Datos del Remitente</h3>
              <p style="margin: 5px 0;"><b>Nombre:</b> {{ printShipment.sender_name || printShipment.senderName }}</p>
              <p style="margin: 5px 0;"><b>Teléfono:</b> {{ printShipment.sender_phone || printShipment.senderPhone }}</p>
              <p style="margin: 5px 0;"><b>Dirección:</b> {{ printShipment.sender_address || printShipment.senderAddress }}</p>
              <p style="margin: 5px 0;"><b>Ciudad:</b> {{ printShipment.origin_city || printShipment.originCity }}</p>
            </div>
            <div style="flex:1; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;">📫 Datos del Destinatario</h3>
              <p style="margin: 5px 0;"><b>Nombre:</b> {{ printShipment.recipient_name || printShipment.recipientName }}</p>
              <p style="margin: 5px 0;"><b>Teléfono:</b> {{ printShipment.recipient_phone || printShipment.recipientPhone }}</p>
              <p style="margin: 5px 0;"><b>Dirección:</b> {{ printShipment.recipient_address || printShipment.recipientAddress }}</p>
              <p style="margin: 5px 0;"><b>Ciudad:</b> {{ printShipment.destination_city || printShipment.destinationCity }}</p>
            </div>
          </div>

          <div style="border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
            <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;">📦 Información del Paquete</h3>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <th style="padding: 8px 0; color:#070b24;">Peso (kg)</th><td style="padding: 8px 0;">{{ printShipment.weight_kg || printShipment.weightKg }} kg</td>
                <th style="padding: 8px 0; color:#070b24;">Cantidad</th><td style="padding: 8px 0;">{{ printShipment.quantity }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <th style="padding: 8px 0; color:#070b24;">Dimensiones</th>
                <td style="padding: 8px 0;">{{ printShipment.length_cm || printShipment.lengthCm || '-' }} x {{ printShipment.width_cm || printShipment.widthCm || '-' }} x {{ printShipment.height_cm || printShipment.heightCm || '-' }} cm</td>
                <th style="padding: 8px 0; color:#070b24;">Distancia</th><td style="padding: 8px 0;">{{ printShipment.distance_km || printShipment.distanceKm || '-' }} km</td>
              </tr>
              <tr>
                <th style="padding: 8px 0; color:#070b24;">Descripción</th><td colspan="3" style="padding: 8px 0;">{{ printShipment.description || 'Sin descripción' }}</td>
              </tr>
              <tr>
                <th style="padding: 8px 0; color:#070b24;">Manejo Especial</th>
                <td colspan="3" style="padding: 8px 0;"><b>{{ (printShipment.is_fragile || printShipment.isFragile) ? '⚠️ Paquete Frágil' : 'Normal' }}</b></td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 3rem; text-align:center; color: #666; font-size: 12px;">
            Documento generado automáticamente por el sistema logístico de Nexgo.<br>
            Para consultas o soporte, comuníquese con nuestras oficinas en Guatemala o visite nuestro sitio web.
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Dropdown menu */
    .dropdown-container .dropdown-menu {
      position: absolute; left: calc(100% + 5px); top: -5px; z-index: 99;
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); min-width: 160px; text-align: left; overflow: hidden;
    }
    .dropdown-item {
      display: block; width: 100%; text-align: left; background: none; border: none; 
      padding: 10px 15px; color: var(--text); cursor: pointer; text-decoration: none; font-size: 13px;
    }
    .dropdown-item:hover { background: var(--bg-hover, #1F2937); color: white; }

    /* Print styles */
    .print-container { display: none; }
    
    @media print {
      :host ::ng-deep app-sidebar,
      .nx-layout { display: none !important; }
      @page { margin: 0; }
      body { margin: 0; padding: 0; background: white !important; }

      .print-container {
        display: block !important;
        position: absolute;
        top: 0; left: 0; width: 100%; height: auto;
        background: white !important; color: black !important;
        z-index: 9999;
      }

      /* Estilos específicos de la Guía */
      .guia-box {
        width: 385px; height: 375px; border: 2px solid black; box-sizing: border-box;
        background: white; color: black; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        display: flex; flex-direction: column;
      }
      .g-row { display: flex; border-bottom: 2px solid black; }
      .v-text-dark {
        writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white;
        width: 24px; text-align: center; font-size: 10px; font-weight: bold; padding: 4px 0; border-right: 2px solid black;
      }
      .v-text-light {
        writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black;
        width: 24px; text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; border-right: 2px solid black; line-height: 1.2;
      }
    }
  `]
})
export class MisEnviosComponent implements OnInit {

  shipments: any[] = [];
  total = 0;
  loading = true;

  printMode: 'guia' | 'formulario' | null = null;
  printShipment: any = null;
  today = new Date();
  openDropdownId: string | null = null;

  constructor(private shipmentService: ShipmentService) { }

  ngOnInit() {
    this.shipmentService.getShipments({ limit: 50 }).subscribe({
      next: (r) => {
        this.shipments = r.data.data;
        this.total = r.data.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  countByStatus(status: string): number {
    return this.shipments.filter((s: any) => s.current_status === status).length;
  }

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === id) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = id;
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    if (!(event.target as HTMLElement).closest('.dropdown-container')) {
      this.openDropdownId = null;
    }
  }

  imprimirGuia(shipment: any) {
    this.printShipment = shipment;
    this.printMode = 'guia';
    setTimeout(() => {
      window.print();
      this.printMode = null;
      this.printShipment = null;
    }, 300);
  }

  imprimirFormulario(shipment: any) {
    this.printShipment = shipment;
    this.printMode = 'formulario';
    setTimeout(() => {
      window.print();
      this.printMode = null;
      this.printShipment = null;
    }, 300);
  }
}
