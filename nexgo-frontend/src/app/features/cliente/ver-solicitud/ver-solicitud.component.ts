import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { Shipment } from '../../../core/models/shipment.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';

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
          <div class="nx-page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
            <div>
              <h1 style="margin-bottom: 0.25rem;">Manifiesto de Envío</h1>
              <p style="opacity: 0.7;">Documentación oficial y detalles logísticos</p>
            </div>
            <div style="display:flex; gap:12px;">
              <button class="nx-btn btn-print-action" (click)="imprimirGuia()" [class.loading]="generatingPdf && printMode === 'guia'">
                <span class="material-symbols-outlined">{{ (generatingPdf && printMode === 'guia') ? 'sync' : 'print' }}</span>
                {{ (generatingPdf && printMode === 'guia') ? 'Generando...' : 'Imprimir Guía' }}
              </button>
              <button class="nx-btn btn-print-action" (click)="imprimirFormulario()" [class.loading]="generatingPdf && printMode === 'formulario'">
                <span class="material-symbols-outlined">{{ (generatingPdf && printMode === 'formulario') ? 'sync' : 'description' }}</span>
                {{ (generatingPdf && printMode === 'formulario') ? 'Manifiesto' : 'Generar Manifiesto' }}
              </button>
              <a routerLink="/cliente/mis-envios" class="nx-btn btn-primary" style="background: #6366f1; border: none; font-weight: 800;">
                <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:4px;">arrow_back</span>
                Volver
              </a>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }
          @if (error) { <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div> }

          @if (!loading && shipment) {
            <!-- MASTER MANIFEST CARD -->
            <div class="manifest-card animate-fade-in">
              
              <!-- HEADER SECTION -->
              <div class="manifest-header">
                <div class="tracking-info">
                  <div class="label-tiny">CÓDIGO DE RASTREO</div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <h2 class="tracking-number">{{ shipment.trackingNumber || $any(shipment).tracking_number }}</h2>
                    <button class="copy-btn" (click)="copyTracking(shipment.trackingNumber || $any(shipment).tracking_number)" [class.success]="copySuccess" title="Copiar guía">
                      <span class="material-symbols-outlined">{{ copySuccess ? 'check_circle' : 'content_copy' }}</span>
                    </button>
                  </div>
                </div>
                <div class="status-box">
                  <span class="status-label">ESTADO ACTUAL</span>
                  <div class="header-actions">
                    <button class="nx-btn btn-primary btn-sm log-btn" (click)="showHistory = true" title="Ver Bitácora">
                      <span class="material-symbols-outlined">history</span> Bitácora
                    </button>
                    <div class="status-indicator" [attr.data-status]="shipment.currentStatus || $any(shipment).current_status">
                      <span class="dot"></span>
                      {{ (shipment.currentStatus || $any(shipment).current_status || '').replace('_', ' ') | uppercase }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- MAIN CONTENT GRID -->
              <div class="manifest-grid">
                
                <!-- ORIGEN -->
                <div class="manifest-column">
                  <div class="col-header">
                    <span class="material-symbols-outlined icon">unarchive</span>
                    <h3>ORIGEN</h3>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Remitente</span>
                    <span class="detail-value">{{ shipment.senderName || $any(shipment).sender_name }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Teléfono</span>
                    <span class="detail-value">{{ shipment.senderPhone || $any(shipment).sender_phone }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Ciudad</span>
                    <span class="detail-value">{{ shipment.originCity || $any(shipment).origin_city }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Dirección de Recolección</span>
                    <span class="detail-value address-box">{{ shipment.senderAddress || $any(shipment).sender_address }}</span>
                  </div>
                </div>

                <!-- DESTINO -->
                <div class="manifest-column">
                  <div class="col-header">
                    <span class="material-symbols-outlined icon">location_on</span>
                    <h3>DESTINO</h3>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Destinatario</span>
                    <span class="detail-value">{{ shipment.recipientName || $any(shipment).recipient_name }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Teléfono</span>
                    <span class="detail-value">{{ shipment.recipientPhone || $any(shipment).recipient_phone }}</span>
                  </div>
                  <div class="detail-row-split">
                    <div class="detail-item">
                      <span class="detail-label">Ubicación</span>
                      <span class="detail-value">{{ shipment.recipientMunicipality || $any(shipment).recipient_municipality || shipment.destinationCity || $any(shipment).destination_city }}, {{ shipment.recipientDepartment || $any(shipment).recipient_department || '-' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Zona</span>
                      <span class="detail-value tag-zone">{{ shipment.recipientZone || $any(shipment).recipient_zone || 'S/D' }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Dirección de Entrega</span>
                    <span class="detail-value address-box">{{ shipment.recipientAddress || $any(shipment).recipient_address }}</span>
                  </div>
                </div>

                <!-- CARGA Y LOGISTICA -->
                <div class="manifest-column">
                  <div class="col-header">
                    <span class="material-symbols-outlined icon">package_2</span>
                    <h3>CARGA Y LOGÍSTICA</h3>
                  </div>
                  <div class="detail-row-split">
                    <div class="detail-item">
                      <span class="detail-label">Peso</span>
                      <span class="detail-value font-highlight">{{ shipment.weightKg || $any(shipment).weight_kg }} lb</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Piezas</span>
                      <span class="detail-value font-highlight">{{ shipment.quantity }}</span>
                    </div>
                  </div>
                  <div class="detail-row-split" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                    <div class="detail-item">
                      <span class="detail-label">No. Orden</span>
                      <span class="detail-value" style="font-family:monospace; color:var(--accent);">{{ shipment.orderNumber || $any(shipment).order_number || '---' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">No. Ticket</span>
                      <span class="detail-value" style="font-family:monospace; color:var(--accent);">{{ shipment.ticketNumber || $any(shipment).ticket_number || '---' }}</span>
                    </div>
                  </div>
                  <div class="logistic-chips">
                    <div class="chip">
                      <span class="c-label">SERVICIO</span>
                      <span class="c-val">{{ shipment.serviceTag || $any(shipment).service_tag || 'DOM' }}</span>
                    </div>
                    <div class="chip">
                      <span class="c-label">DESTINO</span>
                      <span class="c-val">{{ shipment.destinationCode || $any(shipment).destination_code || 'GUA' }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Instrucciones / Referencia</span>
                    <span class="detail-value address-box" style="font-style: italic;">{{ (shipment.comments || $any(shipment).comments) || (shipment.description || $any(shipment).description) || 'Sin instrucciones adicionales' }}</span>
                  </div>
                </div>

              </div>

              <!-- FOOTER ACTION BAR -->
              <div class="manifest-footer">
                <div class="payment-summary">
                  <div class="payment-main">
                    <span class="label-tiny">TOTAL A COBRAR</span>
                    <div class="amount">Q {{ shipment.totalPaymentAmount || $any(shipment).total_payment_amount || '0.00' }}</div>
                  </div>
                  <div class="payment-method">
                    <span class="material-symbols-outlined">payments</span>
                    <span>Pago Contra Entrega</span>
                  </div>
                </div>
                
                <div class="fragile-warning" [class.is-fragile]="shipment.isFragile || $any(shipment).is_fragile">
                  @if (shipment.isFragile || $any(shipment).is_fragile) {
                    <span class="material-symbols-outlined">warning</span>
                    <span>MANEJO FRÁGIL</span>
                  } @else {
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>MANEJO ESTÁNDAR</span>
                  }
                </div>
              </div>

            </div>

            <!-- HISTORY MODAL (BITACORA) PROFESSIONAL RE-DESIGN -->
            @if (showHistory) {
              <div class="modal-overlay" (click)="showHistory = false">
                <div class="modal-content animate-slide-up" (click)="$event.stopPropagation()">
                  <div class="modal-header">
                    <div>
                      <h3>Bitácora de Seguimiento</h3>
                      <p style="font-size: 0.75rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">Historial de movimientos cronológicos</p>
                    </div>
                    <button class="close-btn" (click)="showHistory = false">&times;</button>
                  </div>
                  <div class="modal-body">
                    @if (shipment.statusHistory && shipment.statusHistory.length > 0) {
                      <!-- REVERSED ORDER TO SHOW FIRST STATE AT TOP -->
                      <div class="stepper-log">
                        @for (entry of shipment.statusHistory; track entry.id; let last = $last) {
                          <div class="step-item" [class.last-step]="last">
                            <div class="step-aside">
                              <div class="step-dot" [attr.data-status]="entry.status"></div>
                              @if (!last) { <div class="step-line"></div> }
                            </div>
                            <div class="step-main">
                              <div class="step-card">
                                <div class="step-header">
                                  <div class="updater-info">
                                    <span class="user-avatar" style="background: #6366f1;">
                                      <span class="material-symbols-outlined" style="font-size: 1.2rem;">person</span>
                                    </span>
                                    <div class="text-group">
                                      <span class="mod-by">Actualizado por</span>
                                      <div style="display: flex; align-items: center; gap: 6px;">
                                        <span class="user-name" style="color: #6366f1;">{{ entry.updated_by_username || entry.updatedByUsername || 'sistema' }}</span>
                                        @if (entry.updated_by_role) {
                                          <span style="font-size: 0.6rem; background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 1px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">{{ entry.updated_by_role }}</span>
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  <div class="time-stamp">
                                    <span class="material-symbols-outlined" style="font-size: 0.9rem; vertical-align: middle; margin-right: 2px;">schedule</span>
                                    {{ (entry.createdAt || entry.created_at) | date:'dd MMM, yyyy • HH:mm' }}
                                  </div>
                                </div>
                                <div class="step-body">
                                  <div class="status-change">
                                    <span class="label">Estado:</span>
                                    <span class="status-val" [attr.data-status]="entry.status">{{ entry.status.replace('_', ' ') }}</span>
                                  </div>
                                  @if (entry.notes && entry.notes !== 'Envío registrado en el sistema') {
                                    <p class="step-notes">"{{ entry.notes }}"</p>
                                  }
                                  @if (entry.location) {
                                    <div class="step-location">
                                      <span class="material-symbols-outlined">location_on</span>
                                      {{ entry.location }}
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="empty-log">
                        <span class="material-symbols-outlined">query_stats</span>
                        <p>No se han registrado movimientos todavía.</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

    <!-- ZONA IMPRESIÓN GUÍA (HIDDEN) -->
    @if (printMode === 'guia' && shipment) {
      <div class="print-guia-container">
        <div style="display: flex; justify-content: center; align-items: flex-start; background: white; width: 100mm; height: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 2px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif;">
            
            <div style="display:flex; border-bottom: 2px solid black; height: 65px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Remitente</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ shipment.senderName || $any(shipment).sender_name }}</div>
                <div style="font-size: 15px; font-weight: 700; color: black;">Tel. {{ shipment.senderPhone || $any(shipment).sender_phone }}</div>
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
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ shipment.orderNumber || $any(shipment).order_number || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Orden</div></div>
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ shipment.ticketNumber || $any(shipment).ticket_number || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Ticket</div></div>
                </div>
              </div>
            </div>

            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ shipment.recipientName || $any(shipment).recipient_name }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ shipment.recipientPhone || $any(shipment).recipient_phone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dir: {{ shipment.recipientAddress || $any(shipment).recipient_address }}, {{ shipment.recipientMunicipality || $any(shipment).recipient_municipality || shipment.destinationCity || $any(shipment).destination_city }}, {{ shipment.recipientDepartment || $any(shipment).recipient_department || '' }} {{ shipment.recipientZone || '' }}</div>
                <div style="font-size: 11px; font-weight: 700; margin-top:2px; color: black;">
                  {{ shipment.paymentInstructions || $any(shipment).payment_instructions || 'Favor Cobrar Q' + (shipment.totalPaymentAmount || $any(shipment).total_payment_amount || '0.00') + ' con envío incluido' }}
                </div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">{{ shipment.serviceTag || $any(shipment).service_tag || 'DOM' }}</div>
              </div>
            </div>

            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black; font-family: monospace;">Guía No.<br>{{ getTrackingPrefix() }}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 5px;">
                <svg id="barcodeCanvasDetail"></svg>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="flex:1; border-bottom: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                  PIEZA<br><span style="font-size: 28px; line-height: 1;">{{ currentPieceCount | number:'2.0' }}</span>DE<br><span style="font-size: 24px; line-height: 0.8;">{{ totalPiecesCount | number:'2.0' }}</span>
                </div>
              </div>
            </div>

            <div style="display:flex; border-bottom: 2px solid black; height: 110px; align-items:stretch;">
              <div style="flex:1; display:flex; align-items:center; padding: 5px; gap: 10px;">
                <div style="border: 3px solid black; font-size: 64px; font-weight: 900; padding: 4px 10px; line-height: 1; color: black;">{{ shipment.destinationCode || $any(shipment).destination_code || 'GUA' }}</div>
                <div style="font-size: 14px; font-weight: 800; line-height: 1.1; color: black;">GT-004:<br>paquete<br>pequeño</div>
              </div>
              <div style="width: 140px; display:flex; flex-direction:column;">
                <div style="flex:1; border-bottom:2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                  PESO lb<br><span style="font-size: 28px; line-height: 1;">{{ shipment.weightKg || $any(shipment).weight_kg }}</span>DE<br><span style="font-size: 24px; line-height: 0.8;">999</span>
                </div>
                <div style="height: 45px; display: flex; align-items: flex-end; justify-content: flex-end; padding: 4px;">
                  <div style="border: 2.5px solid black; text-align: center; padding: 2px 5px; color: black;">
                    <div style="font-size: 8px; font-weight: 900;">Forma Pago</div>
                    <div style="font-size: 18px; font-weight: 900; line-height: 1;">COLLECT</div>
                  </div>
                </div>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: black;">
                  Servicio<br><span style="font-size: 20px; line-height: 1;">COD</span>
                </div>
              </div>
            </div>

            <div style="display:flex; height: 35px; background: black; color: white;">
              <div style="flex:1; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ getDeptCode() }}</div>
                <div style="font-size: 7px; font-weight: bold;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ shipment.recipientMunicipality || $any(shipment).recipient_municipality || shipment.destinationCity || $any(shipment).destination_city || 'Xela' }}</div>
                <div style="font-size: 7px; font-weight: bold;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 20px; font-weight: 900; line-height: 1;">{{ shipment.recipientZone || $any(shipment).recipient_zone || 'S/D' }}</div>
                <div style="font-size: 7px; font-weight: bold;">Zona</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ZONA IMPRESIÓN FORMULARIO (HIDDEN) -->
    @if (printMode === 'formulario' && shipment) {
      <div class="print-manifest-container" style="background: white !important;">
        <div #manifestContainer class="manifest-doc">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border: 2px solid black; padding: 10px;">
             <div style="width: 150px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                   <div style="width: 30px; height: 30px; background: black; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; border-radius: 4px;">NX</div>
                   <div style="font-size: 14px; font-weight: 900;">NEXGO</div>
                </div>
                <div style="font-size: 8px; font-weight: 700; color: #444; margin-top: 5px;">NACIONALES DELIVERY SERVICES</div>
             </div>
             <div style="text-align: center; flex: 1;">
                <div class="m-title" style="margin-top:0;">MANIFIESTO ELECTRÓNICO DE CARGA</div>
                <div class="m-subtitle" style="text-transform: uppercase;">NIT: 9876543-2 | TEL: 2200-0000</div>
                <div class="m-subtitle" style="text-transform: uppercase;">ZONA 10, CIUDAD DE GUATEMALA</div>
             </div>
             <div style="width: 150px; text-align: right;">
                <div style="font-size: 9px; font-weight: 800;">No. Guia: <b>{{ shipment.trackingNumber || $any(shipment).tracking_number }}</b></div>
             </div>
          </div>

          <table class="m-table">
            <tr>
              <td><span class="m-label">FECHA EXPEDICIÓN</span><span class="m-value">{{ (shipment.createdAt || $any(shipment).created_at) | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td><span class="m-label">TIPO MANIFIESTO</span><span class="m-value">ELECTRONICO</span></td>
              <td><span class="m-label">ORIGEN VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ shipment.originCity || $any(shipment).origin_city }}</span></td>
              <td><span class="m-label">DESTINO VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ shipment.destinationCity || $any(shipment).destination_city }}</span></td>
            </tr>

            <tr><td colspan="4" class="m-section-header">INFORMACIÓN DEL VEHÍCULO Y CONDUCTOR</td></tr>
            <tr>
              <td colspan="2"><span class="m-label">TITULAR MANIFIESTO</span><span class="m-value">NACIONALES DELIVERY SERVICES</span></td>
              <td colspan="1"><span class="m-label">IDENTIFICACIÓN</span><span class="m-value">NIT 9876543-2</span></td>
              <td colspan="1"><span class="m-label">CIUDAD</span><span class="m-value">GUATEMALA</span></td>
            </tr>
            <tr>
               <td><span class="m-label">PLACA</span><span class="m-value">M-{{ getDeptCode() }}</span></td>
               <td><span class="m-label">MARCA</span><span class="m-value">VARIAS</span></td>
               <td><span class="m-label">CONFIGURACION</span><span class="m-value">URBANO / PANEL</span></td>
               <td><span class="m-label">PLAZO VENCIMIENTO SOAT</span><span class="m-value">31/12/2026</span></td>
            </tr>
            <tr>
               <td colspan="2"><span class="m-label">CONDUCTOR</span><span class="m-value">{{ shipment.driverName || 'REPARTIDOR ASIGNADO' }}</span></td>
               <td><span class="m-label">DOCUMENTO ID</span><span class="m-value">---</span></td>
               <td><span class="m-label">TELÉFONO</span><span class="m-value">{{ shipment.driverPhone || '---' }}</span></td>
            </tr>

            <tr><td colspan="4" class="m-section-header">INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA</td></tr>
            <tr style="background: #f3f4f6; font-size: 7px; font-weight: 800; text-align: center;">
              <td># REMESA</td>
              <td>CANT.</td>
              <td>DESCRIPCIÓN PRODUCTO / NATURALEZA</td>
              <td>REMITENTE / DESTINATARIO</td>
            </tr>
            <tr style="height: 60px;">
              <td style="text-align: center;"><span class="m-value">{{ getTrackingPrefix() }}</span></td>
              <td style="text-align: center;"><span class="m-value">{{ shipment.quantity }}</span></td>
              <td>
                <span class="m-value" style="display: block; border-bottom: 1px solid #ccc; padding-bottom: 2px;">{{ shipment.description || 'SIN DESCRIPCION' }}</span>
                <span style="font-size: 8px;"><b>Peso:</b> {{ shipment.weightKg || $any(shipment).weight_kg }} lb | <b>Fragilidad:</b> {{ shipment.isFragile || $any(shipment).is_fragile ? 'SI' : 'NO' }}</span>
              </td>
              <td>
                <span class="m-label">REMITENTE:</span> <span class="m-value" style="text-transform:uppercase;">{{ shipment.senderName || $any(shipment).sender_name }}</span><br>
                <span class="m-label" style="margin-top:2px;">DESTINATARIO:</span> <span class="m-value" style="text-transform:uppercase;">{{ shipment.recipientName || $any(shipment).recipient_name }}</span>
              </td>
            </tr>

            <tr><td colspan="4" class="m-section-header">VALORES Y OBSERVACIONES</td></tr>
            <tr>
              <td colspan="2">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">VALOR TOTAL:</span><span class="m-value">Q{{ shipment.estimatedCost || $any(shipment).estimated_cost || '0.00' }}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">RETENCION:</span><span class="m-value">Q0.00</span></div>
                <div style="display: flex; justify-content: space-between; padding: 2px 0; font-weight: 900;"><span class="m-label">TOTAL COBRAR:</span><span class="m-value">Q{{ shipment.totalPaymentAmount || $any(shipment).total_payment_amount || '0.00' }}</span></div>
              </td>
              <td colspan="2">
                <span class="m-label">OBSERVACIONES:</span>
                <span style="font-size: 8px; font-weight: 600;">{{ shipment.paymentInstructions || $any(shipment).payment_instructions || 'N/A' }}</span><br>
                <span style="font-size: 8px;">{{ shipment.comments || $any(shipment).comments || '' }}</span>
              </td>
            </tr>
          </table>

          <div style="margin-top: 20px; font-size: 7px; color: #888; text-align: center;">
            Este documento es una representación electrónica del manifiesto de carga Nexgo. Generado el {{ today | date:'dd/MM/yyyy HH:mm' }}.
          </div>
        </div>
      </div>
    }
}
</div>
</main>
</div>
  `,
  styles: [`
    .manifest-card {
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    }

    /* HEADER */
    .manifest-header {
      padding: 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to right, rgba(99, 102, 241, 0.05), transparent);
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    }
    .label-tiny { font-size: 0.65rem; color: #9ca3af; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
    .tracking-number { font-size: 2.2rem; font-weight: 900; color: white; background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
    
    .copy-btn { 
      background: rgba(255,255,255,0.05); border: none; color: #6366f1; border-radius: 8px; cursor: pointer; padding: 6px; display: flex; transition: all 0.2s;
    }
    .copy-btn:hover { background: rgba(99, 102, 241, 0.15); transform: scale(1.1); }
    .copy-btn.success { color: #10b981; }

    .status-box { display: flex; flex-direction: column; align-items: flex-end; }
    .status-label { font-size: 0.65rem; color: #9ca3af; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .header-actions { display: flex; align-items: center; gap: 10px; }

    .log-btn { 
      background: #6366f1; color: white; border: none; font-size: 0.75rem; font-weight: 800;
      height: 38px; padding: 0 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
    }
    .log-btn:hover { background: #4f46e5; transform: translateY(-1px); }

    .status-indicator {
      display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 16px; border-radius: 12px; font-size: 0.75rem; font-weight: 800;
    }
    .status-indicator .dot { width: 8px; height: 8px; border-radius: 50%; }
    
    .status-indicator[data-status="PENDIENTE"] { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .status-indicator[data-status="PENDIENTE"] .dot { background: #fbbf24; box-shadow: 0 0 10px #fbbf24; }
    
    .status-indicator[data-status="EN_TRANSITO"] { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
    .status-indicator[data-status="EN_TRANSITO"] .dot { background: #60a5fa; box-shadow: 0 0 10px #60a5fa; }
    
    .status-indicator[data-status="ENTREGADO"] { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
    .status-indicator[data-status="ENTREGADO"] .dot { background: #34d399; box-shadow: 0 0 10px #34d399; }

    /* GRID */
    .manifest-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: rgba(255, 255, 255, 0.1);
    }
    .manifest-column { background: #111827; padding: 2rem; }
    .col-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.50rem; color: #6366f1; }
    .col-header h3 { margin: 0; font-size: 0.9rem; font-weight: 800; letter-spacing: 0.05em; }
    .col-header .icon { font-size: 1.2rem; }

    .detail-item { margin-bottom: 1.25rem; }
    .detail-label { display: block; font-size: 0.68rem; color: #6b7280; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .detail-value { display: block; font-size: 1rem; color: #e5e7eb; font-weight: 600; }
    .font-highlight { font-size: 1.25rem; color: white; font-weight: 800; }
    
    .address-box { font-size: 0.9rem; color: #9ca3af; line-height: 1.5; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
    .detail-row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
    .tag-zone { display: inline-block; background: white; color: #000; padding: 2px 10px; border-radius: 4px; font-weight: 900; }

    .logistic-chips { display: flex; gap: 10px; margin-bottom: 1.5rem; }
    .chip { flex: 1; background: rgba(255, 255, 255, 0.03); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); }
    .c-label { display: block; font-size: 0.55rem; color: #6b7280; font-weight: 800; margin-bottom: 2px; }
    .c-val { font-size: 0.85rem; font-weight: 800; color: white; }

    /* FOOTER */
    .manifest-footer {
      padding: 1.5rem 2rem; background: #0f172a; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .payment-summary { display: flex; align-items: center; gap: 2rem; }
    .amount { font-size: 1.75rem; font-weight: 900; color: #10b981; }
    .payment-method { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem; font-weight: 600; padding-left: 2rem; border-left: 1px solid rgba(255, 255, 255, 0.1); }
    
    .btn-print-action {
      background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem; 
      font-weight: 800; height: 38px; padding: 0 16px; border-radius: 12px; display: flex; align-items: center; gap: 8px;
      transition: all var(--tr);
    }
    .btn-print-action:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); border-color: var(--primary); }
    .btn-print-action.loading { opacity: 0.7; cursor: wait; }
    .btn-print-action .material-symbols-outlined { font-size: 1.1rem; color: var(--primary); }

    .fragile-warning { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.8rem; padding: 8px 16px; border-radius: 8px; }
    .fragile-warning.is-fragile { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
    .fragile-warning:not(.is-fragile) { color: #64748b; opacity: 0.6; }

    /* MODAL PROFESSIONAL RE-DESIGN */
    .modal-overlay { 
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); 
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; 
    }
    .modal-content { 
      background: #0f172a; border-radius: 20px; width: 100%; max-width: 650px; max-height: 85vh; 
      overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 70px -12px rgba(0,0,0,0.8); 
      border: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header { 
      padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); 
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.02);
    }
    .modal-header h3 { margin: 0; color: white; font-weight: 800; font-size: 1.2rem; }
    .close-btn { 
      background: none; border: none; color: #94a3b8; font-size: 2rem; cursor: pointer; line-height: 1; padding: 0;
      transition: color 0.2s;
    }
    .close-btn:hover { color: white; }
    .modal-body { padding: 2rem; overflow-y: auto; background: #0f172a; }

    /* STEPPER LOG */
    .stepper-log { display: flex; flex-direction: column; }
    .step-item { display: flex; gap: 1.5rem; }
    .step-aside { display: flex; flex-direction: column; align-items: center; min-width: 20px; }
    
    .step-dot { 
      width: 14px; height: 14px; border-radius: 50%; background: #0f172a; border: 3px solid #334155; 
      position: relative; z-index: 2; margin-top: 4px;
    }
    .step-dot[data-status="PENDIENTE"] { border-color: #fbbf24; }
    .step-dot[data-status="RECOGIDO"] { border-color: #a855f7; }
    .step-dot[data-status="EN_TRANSITO"] { border-color: #3b82f6; }
    .step-dot[data-status="ENTREGADO"] { border-color: #10b981; }

    .step-line { width: 2px; flex-grow: 1; background: rgba(51, 65, 85, 0.5); margin: 4px 0; }
    .step-main { flex-grow: 1; padding-bottom: 2.5rem; }
    .step-item.last-step .step-main { padding-bottom: 1rem; }

    .step-card { 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; 
      padding: 1.25rem; transition: background 0.2s;
    }
    .step-card:hover { background: rgba(255,255,255,0.05); }

    .step-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .updater-info { display: flex; align-items: center; gap: 12px; }
    .user-avatar { 
      width: 36px; height: 36px; border-radius: 10px; background: #6366f1; color: white; 
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;
    }
    .text-group { display: flex; flex-direction: column; }
    .mod-by { font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .user-name { font-size: 1rem; color: white; font-weight: 700; }
    .time-stamp { font-size: 0.75rem; color: #64748b; font-weight: 600; }

    .step-body { display: flex; flex-direction: column; gap: 0.75rem; }
    .status-change { display: flex; align-items: center; gap: 8px; }
    .status-change .label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    .status-val { 
      font-size: 0.75rem; font-weight: 800; padding: 2px 10px; border-radius: 6px; 
      background: rgba(255,255,255,0.05); color: white;
    }
    .status-val[data-status="PENDIENTE"] { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
    .status-val[data-status="EN_TRANSITO"] { color: #60a5fa; background: rgba(96, 165, 250, 0.1); }
    .status-val[data-status="ENTREGADO"] { color: #34d399; background: rgba(52, 211, 153, 0.1); }

    .step-notes { 
      font-size: 0.9rem; color: #cbd5e1; line-height: 1.5; font-style: italic; 
      border-left: 3px solid rgba(99, 102, 241, 0.4); padding-left: 1rem; margin: 0;
    }
    .step-location { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #64748b; font-weight: 600; }
    .step-location span { font-size: 1rem; color: #6366f1; }

    .empty-log { text-align: center; padding: 3rem; color: #475569; }
    .empty-log span { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }

    /* Print hidden containers */
    .print-guia-container, .print-manifest-container { 
      display: block; position: fixed; left: -9999px; top: 0; 
    }
    .manifest-doc {
      width: 210mm; min-height: 297mm; background: white; color: black !important;
      font-family: 'Arial Narrow', Arial, sans-serif; padding: 10mm; box-sizing: border-box;
      border: 1px solid #eee; margin: 0 auto;
    }
    .m-table { width: 100%; border-collapse: collapse; border: 2px solid black !important; color: black !important; }
    .m-table td { border: 1px solid black !important; padding: 4px; vertical-align: top; font-size: 9px; line-height: 1.1; color: black !important; }
    .m-title { font-size: 14px; font-weight: 900; text-align: center; margin-bottom: 4px; color: black !important; }
    .m-subtitle { font-size: 10px; font-weight: 700; text-align: center; color: #444 !important; }
    .m-label { font-weight: 800; font-size: 8px; color: #333 !important; margin-bottom: 2px; display: block; text-transform: uppercase; }
    .m-value { font-weight: 600; font-size: 10px; color: black !important; }
    .m-section-header { background: #e5e7eb !important; font-weight: 800; text-align: center; font-size: 9px; border-top: 2px solid black !important; border-bottom: 2px solid black !important; color: black !important; }

    @media print {
      body { background: white !important; }
      .nx-layout { display: none !important; }
      .print-guia-container, .print-manifest-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; z-index: 9999; }
    }
  `]
})
export class VerSolicitudComponent implements OnInit {
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;
  @ViewChild('manifestContainer') manifestContainer!: ElementRef;

  shipment: Shipment | null = null;
  loading = true;
  error = '';

  showHistory = false;
  copySuccess = false;

  generatingPdf = false;
  printMode: 'guia' | 'formulario' | null = null;
  currentPieceCount: number = 1;
  totalPiecesCount: number = 1;
  today = new Date();

  constructor(
    private route: ActivatedRoute,
    private shipmentService: ShipmentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.shipmentService.getShipmentById(id).subscribe({
        next: (r) => {
          this.shipment = r.data;
          // Robust sort by ID Ascending (Oldest First)
          if (this.shipment && this.shipment.statusHistory) {
            const sorted = [...this.shipment.statusHistory].sort((a, b) => (a.id || 0) - (b.id || 0));
            this.shipment.statusHistory = sorted;
          }
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

  copyTracking(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  getTrackingPrefix(): string {
    const t = this.shipment?.trackingNumber || (this.shipment as any)?.tracking_number || '';
    return t.substring(0, 12);
  }

  getDeptCode(): string {
    const dept = this.shipment?.recipientDepartment || (this.shipment as any)?.recipient_department || '';
    if (dept.includes('Guatemala')) return 'GUA';
    if (dept.includes('Huehuetenango')) return 'HUE';
    if (dept.includes('Quetzaltenango')) return 'XELA';
    return 'GUA';
  }

  imprimirGuia() {
    if (!this.shipment || this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'guia';
    this.totalPiecesCount = this.shipment.quantity || 1;
    this.cdr.detectChanges();

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [100, 100] });

    const generateAllPages = async () => {
      try {
        const tracking = this.shipment?.trackingNumber || (this.shipment as any)?.tracking_number || 'ND0000000';
        
        // Esperar renderizado inicial
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          JsBarcode("#barcodeCanvasDetail", tracking, {
            format: "CODE128", width: 2.2, height: 55, displayValue: false, margin: 0,
            background: "#ffffff", lineColor: "#000000"
          });
        } catch (bErr) {
          console.error('Error barcode:', bErr);
        }

        for (let i = 1; i <= this.totalPiecesCount; i++) {
          this.currentPieceCount = i;
          this.cdr.detectChanges();
          await new Promise(resolve => setTimeout(resolve, 300));

          const element = this.guiaContainer.nativeElement;
          const canvas = await html2canvas(element, {
            scale: 3.5, useCORS: true, backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              const el = clonedDoc.querySelector('.print-guia-container') as HTMLElement;
              if (el) { el.style.left = '0'; el.style.top = '0'; el.style.position = 'relative'; el.style.display = 'block'; el.style.visibility = 'visible'; }
            }
          });

          const imgData = canvas.toDataURL('image/png');
          if (i > 1) doc.addPage([100, 100], 'p');
          doc.addImage(imgData, 'PNG', 0, 0, 100, 100);
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const win = window.open(pdfUrl, '_blank');
        if (!win) {
          doc.save(`Guia_${tracking}.pdf`);
          alert('Ventana emergente bloqueada. Se ha descargado el PDF.');
        }
      } catch (err) {
        console.error('Error PDF:', err);
        alert('Error al generar PDF. Reintenta.');
      } finally {
        this.printMode = null;
        this.generatingPdf = false;
        this.cdr.detectChanges();
      }
    };
    generateAllPages();
  }

  imprimirFormulario() {
    if (!this.shipment || this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'formulario';
    this.cdr.detectChanges();

    setTimeout(async () => {
      try {
        const element = this.manifestContainer.nativeElement;
        const canvas = await html2canvas(element, {
          scale: 3, useCORS: true, backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.print-manifest-container') as HTMLElement;
            if (el) { el.style.left = '0'; el.style.top = '0'; el.style.position = 'relative'; el.style.display = 'block'; el.style.visibility = 'visible'; }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = doc.internal.pageSize.getWidth();
        const imgProps = doc.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
      } catch (err) {
        console.error('Error Manifest:', err);
      } finally {
        this.printMode = null;
        this.generatingPdf = false;
        this.cdr.detectChanges();
      }
    }, 1000);
  }
}
