import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment } from '../../../core/models/shipment.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-mis-envios',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom;">inventory_2</span> Mis Envíos</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Historial de Envíos</h1>
            <p>Todos tus envíos registrados en Nexgo</p>
            <div class="header-actions">
              <a routerLink="/cliente/nuevo-envio" class="nx-btn btn-accent"><span class="material-symbols-outlined">add_box</span> Nuevo envío</a>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <!-- Stats row -->
            <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">inventory_2</span></div>
                <div class="kpi-label">Total envíos</div>
                <div class="kpi-value">{{ total }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">pending_actions</span></div>
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">local_shipping</span></div>
                <div class="kpi-label">En tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">check_circle</span></div>
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
                               <a [routerLink]="['/cliente/ver-solicitud', s.id]" class="dropdown-item"><span class="material-symbols-outlined" style="font-size:16px; margin-right:6px">visibility</span> Ver Solicitud</a>
                               <a (click)="imprimirGuia(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id ? 0.6 : 1">
                                 <span class="material-symbols-outlined" style="font-size:16px; margin-right:6px">print</span> 
                                 {{ generatingPdfId === s.id ? 'Generando...' : 'Imprimir Guía' }}
                               </a>
                               <a (click)="imprimirFormulario(s)" class="dropdown-item"><span class="material-symbols-outlined" style="font-size:16px; margin-right:6px">description</span> Formulario</a>
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
        <div style="display: flex; justify-content: center; align-items: flex-start; background: white; width: 100mm; height: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 2px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif;">
            
            <!-- Row 1: REMITENTE -->
            <div style="display:flex; border-bottom: 2px solid black; height: 65px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Remitente</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ printShipment.sender_name || printShipment.senderName }}</div>
                <div style="font-size: 15px; font-weight: 700; color: black;">Tel. {{ printShipment.sender_phone || printShipment.senderPhone }}</div>
              </div>
              <div style="width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #ccc; padding: 2px;">
                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="width:24px; height:24px; background:black; color:white; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size: 14px;">📦</div>
                  <div style="text-align:left;">
                    <div style="font-size:12px; font-weight:900; line-height:1; color: black;">Nacionales</div>
                    <div style="font-size:7px; font-weight:bold; color: #444;">Delivery Services</div>
                  </div>
                  <div style="font-size:14px; font-weight:900; margin-left:4px; color: black;">GT</div>
                </div>
                <div style="display:flex; gap:10px; margin-top:2px;">
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">4</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Orden</div></div>
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">4</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Ticket</div></div>
                </div>
              </div>
            </div>

            <!-- Row 2: DESTINATARIO -->
            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ printShipment.recipient_name || printShipment.recipientName }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ printShipment.recipient_phone || printShipment.recipientPhone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dirección: {{ printShipment.recipient_address || printShipment.recipientAddress }}</div>
                <div style="font-size: 11px; font-weight: 700; margin-top:2px; color: black;">Favor Cobrar Q{{ printShipment.total_price || '0.00' }} con envío incluido</div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">DOM</div>
              </div>
            </div>

            <!-- Row 3: MIDDLE SECTION (BARCODE) -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black; font-family: monospace;">Guía No.<br>{{ printShipment.tracking_number || printShipment.trackingNumber | slice:0:12 }}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 5px;">
                <svg id="barcodeCanvas"></svg>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="flex:1; border-bottom: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                  PIEZA<br><span style="font-size: 28px; line-height: 1;">01</span>DE<br><span style="font-size: 24px; line-height: 0.8;">{{ printShipment.quantity | number:'2.0' }}</span>
                </div>
              </div>
            </div>

            <!-- Row 4: GUA SECTION -->
            <div style="display:flex; border-bottom: 2px solid black; height: 110px; align-items:stretch;">
              <div style="flex:1; display:flex; align-items:center; padding: 5px; gap: 10px;">
                <div style="border: 3px solid black; font-size: 64px; font-weight: 900; padding: 4px 10px; line-height: 1; color: black;">GUA</div>
                <div style="font-size: 14px; font-weight: 800; line-height: 1.1; color: black;">GT-004:<br>paquete<br>pequeño</div>
              </div>
              <div style="width: 140px; display:flex; flex-direction:column;">
                <div style="flex:1; display:flex; flex-direction:column; border-left:2px solid black;">
                  <div style="flex:1; border-bottom:2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                    PESO lb<br><span style="font-size: 28px; line-height: 1;">{{ printShipment.weight_kg || printShipment.weightKg }}</span>DE<br><span style="font-size: 24px; line-height: 0.8;">999</span>
                  </div>
                  <div style="height: 45px; display: flex; align-items: flex-end; justify-content: flex-end; padding: 4px;">
                    <div style="border: 2.5px solid black; text-align: center; padding: 2px 5px; color: black;">
                      <div style="font-size: 8px; font-weight: 900;">Forma Pago</div>
                      <div style="font-size: 18px; font-weight: 900; line-height: 1;">COLLECT</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: black;">
                  Servicio<br><span style="font-size: 20px; line-height: 1;">COD</span>
                </div>
              </div>
            </div>

            <!-- Row 5: FOOTER -->
            <div style="display:flex; height: 35px; background: black; color: white;">
              <div style="flex:1; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">QTZ</div>
                <div style="font-size: 7px; font-weight: bold;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">Xela</div>
                <div style="font-size: 7px; font-weight: bold;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 20px; font-weight: 900; line-height: 1;">3</div>
                <div style="font-size: 7px; font-weight: bold;">Zona</div>
              </div>
            </div>
            <div style="font-size: 6px; text-align: center; color: black;">** Guía sujeta a términos y condiciones **</div>
          </div>
        </div>
      </div>
    }

    <!-- ZONA IMPRESIÓN FORMULARIO -->
    @if (printMode === 'formulario' && printShipment) {
      <div class="print-container">
        <div style="padding: 2cm; font-family: 'Helvetica', Arial, sans-serif; max-width: 800px; margin: 0 auto; color: black;">
          <div style="text-align:center; margin-bottom: 2rem; border-bottom: 2px solid #070b24; padding-bottom: 1rem;">
            <h1 style="margin:0; font-size: 28px; color: #070b24;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Nacionales Delivery Services</h1>
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
              <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> Datos del Remitente</h3>
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
            <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Información del Paquete</h3>
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
                <td colspan="3" style="padding: 8px 0;">
                  <b>
                    @if (printShipment.is_fragile || printShipment.isFragile) {
                      <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> Paquete Frágil
                    } @else {
                      Normal
                    }
                  </b>
                </td>
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
    .print-container { 
      display: block; 
      position: fixed; 
      left: -9999px; /* Fuera de la pantalla pero visible para el renderizador */
      top: 0;
      z-index: -1;
    }
    
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
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;

  shipments: any[] = [];
  total = 0;
  loading = true;

  printMode: 'guia' | 'formulario' | null = null;
  printShipment: any = null;
  generatingPdfId: string | null = null;
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
    if (this.generatingPdfId) return;
    this.generatingPdfId = shipment.id;
    this.printShipment = shipment;
    this.printMode = 'guia';
    
    // Esperar a que Angular renderice el contenedor
    setTimeout(async () => {
      try {
        const tracking = shipment.tracking_number || 'ND0000000';
        
        // Generar Código de Barras
        JsBarcode("#barcodeCanvas", tracking, {
          format: "CODE128",
          width: 2.2, 
          height: 55,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000"
        });

        const element = this.guiaContainer.nativeElement;
        
        const canvas = await html2canvas(element, {
          scale: 4, 
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.print-container') as HTMLElement;
            if (el) {
              el.style.left = '0';
              el.style.top = '0';
              el.style.position = 'relative';
              el.style.display = 'block';
              el.style.visibility = 'visible';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [100, 100]
        });
        
        doc.addImage(imgData, 'PNG', 0, 0, 100, 100);
        doc.autoPrint();
        const pdfUrl = URL.createObjectURL(doc.output('blob'));
        window.open(pdfUrl, '_blank');
        
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        this.printMode = null;
        this.printShipment = null;
        this.generatingPdfId = null;
      }
    }, 800);
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
