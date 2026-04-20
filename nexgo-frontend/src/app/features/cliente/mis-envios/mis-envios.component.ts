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

import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-mis-envios',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink, FormsModule],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom;">inventory_2</span> Mis Envíos</span></div>
        <div class="nx-content">          <div class="nx-page-header">
            <div class="header-main-row">
              <div>
                <h1>Historial de Envíos</h1>
                <p>Todos tus envíos registrados en Nexgo</p>
              </div>
            </div>
            <div class="header-actions-row">
              <a routerLink="/cliente/nuevo-envio" class="nx-btn btn-accent"><span class="material-symbols-outlined">add_box</span> Nuevo envío</a>
              <div class="search-box">
                <span class="material-symbols-outlined search-icon">search</span>
                <input type="text" [(ngModel)]="searchText" placeholder="Buscar por todos los campos de la tabla..." class="nx-input search-input" />
              </div>
              
              <div class="table-tools">
                <div class="date-picker-container" (click)="$event.stopPropagation()">
                  <button class="nx-btn btn-date-picker" (click)="toggleMonthMenu($event)" [class.active]="isMonthMenuOpen">
                    <span class="material-symbols-outlined">calendar_month</span>
                    {{ getSelectedDateLabel() }}
                    <span class="material-symbols-outlined arrow" [style.transform]="isMonthMenuOpen ? 'rotate(180deg)' : 'none'">expand_more</span>
                  </button>

                  @if (isMonthMenuOpen) {
                    <div class="month-picker-dropdown animate-scale-up">
                      <div class="picker-header">
                        <button class="nav-btn" (click)="changeTempYear(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
                        <span class="picker-year">{{ tempYear }}</span>
                        <button class="nav-btn" (click)="changeTempYear(1)"><span class="material-symbols-outlined">chevron_right</span></button>
                      </div>
                      <div class="month-grid">
                        @for (m of monthsShort; track m.value) {
                          <button class="month-item" 
                                  [class.selected]="selectedMonth === m.value && selectedYear === tempYear"
                                  (click)="selectMonth(m.value)">
                            {{ m.label }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>

                <button class="nx-btn btn-columns" (click)="toggleColumnMenu($event)">
                  <span class="material-symbols-outlined">view_column</span> Columnas
                </button>
                
                @if (isColumnMenuOpen) {
                  <div class="columns-dropdown animate-fade-in" (click)="$event.stopPropagation()">
                    <div style="font-weight:700; margin-bottom:8px; font-size:0.75rem; color:var(--accent); text-transform:uppercase;">Visibilidad Columnas</div>
                    @for (col of columnConfigs; track col.key) {
                      <label class="column-opt">
                        <input type="checkbox" [(ngModel)]="col.visible" />
                        <span>{{ col.label }}</span>
                      </label>
                    }
                  </div>
                }
                
                <button class="nx-btn btn-export" (click)="exportToExcel()">
                  <span class="material-symbols-outlined">download</span> Exportar
                </button>
              </div>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <!-- Stats row -->
            <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
              <!-- ... existing KPI code remains same ... -->
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === null" (click)="activeStatusFilter = null">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">inventory_2</span></div>
                <div class="kpi-label">Total envíos</div>
                <div class="kpi-value">{{ total }}</div>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'PENDIENTE'" (click)="toggleStatusFilter('PENDIENTE')">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">pending_actions</span></div>
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'EN_TRANSITO'" (click)="toggleStatusFilter('EN_TRANSITO')">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">local_shipping</span></div>
                <div class="kpi-label">En tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'ENTREGADO'" (click)="toggleStatusFilter('ENTREGADO')">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">check_circle</span></div>
                <div class="kpi-label">Entregados</div>
                <div class="kpi-value" style="color:var(--status-delivered);">{{ countByStatus('ENTREGADO') }}</div>
              </div>
            </div>

            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead><tr>
                    @if (isColumnVisible('guia')) {
                      <th>
                        <div style="display:flex; align-items:center; gap:8px;">
                          Guía 
                          <button class="filter-btn" [class.active]="showFilters.tracking" (click)="toggleColumnFilter('tracking')">
                            <span class="material-symbols-outlined filter-ico">filter_alt</span>
                          </button>
                        </div>
                        @if (showFilters.tracking) {
                          <input [(ngModel)]="columnFilters.tracking" class="nx-input col-filter-input" placeholder="Filtrar guía..." (click)="$event.stopPropagation()" />
                        }
                      </th>
                    }
                    @if (isColumnVisible('fecha')) { <th>Fecha</th> }
                    @if (isColumnVisible('remitente')) { <th>Remitente</th> }
                    @if (isColumnVisible('destinatario')) { <th>Destinatario</th> }
                    @if (isColumnVisible('origen')) {
                      <th>
                        <div style="display:flex; align-items:center; gap:8px;">
                          Origen
                          <button class="filter-btn" [class.active]="showFilters.origen" (click)="toggleColumnFilter('origen')">
                            <span class="material-symbols-outlined filter-ico">filter_alt</span>
                          </button>
                        </div>
                        @if (showFilters.origen) {
                          <input [(ngModel)]="columnFilters.origen" class="nx-input col-filter-input" placeholder="Filtrar origen..." (click)="$event.stopPropagation()" />
                        }
                      </th>
                    }
                    @if (isColumnVisible('destino')) {
                      <th>
                        <div style="display:flex; align-items:center; gap:8px;">
                          Destino
                          <button class="filter-btn" [class.active]="showFilters.destino" (click)="toggleColumnFilter('destino')">
                            <span class="material-symbols-outlined filter-ico">filter_alt</span>
                          </button>
                        </div>
                        @if (showFilters.destino) {
                          <input [(ngModel)]="columnFilters.destino" class="nx-input col-filter-input" placeholder="Filtrar destino..." (click)="$event.stopPropagation()" />
                        }
                      </th>
                    }
                    @if (isColumnVisible('peso')) { <th>Peso</th> }
                    @if (isColumnVisible('costo')) { <th>Costo est.</th> }
                    @if (isColumnVisible('estado')) {
                      <th>
                        <div style="display:flex; align-items:center; gap:8px;">
                          Estado
                          <button class="filter-btn" [class.active]="showFilters.status" (click)="toggleColumnFilter('status')">
                            <span class="material-symbols-outlined filter-ico">filter_alt</span>
                          </button>
                        </div>
                        @if (showFilters.status) {
                          <input [(ngModel)]="columnFilters.status" class="nx-input col-filter-input" placeholder="Filtrar estado..." (click)="$event.stopPropagation()" />
                        }
                      </th>
                    }
                    @if (isColumnVisible('acciones')) { <th style="min-width: 200px;">Acciones</th> }
                  </tr></thead>
                  <tbody>
                    @for (s of filteredShipments; track s.id; let i = $index) {
                      <tr>
                        @if (isColumnVisible('guia')) { <td class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</td> }
                        @if (isColumnVisible('fecha')) { <td style="font-size:.8rem;">{{ s.created_at | date:'dd/MM/yy' }}</td> }
                        @if (isColumnVisible('remitente')) { <td style="font-size:.83rem;">{{ s.sender_name }}</td> }
                        @if (isColumnVisible('destinatario')) { <td style="font-size:.83rem;">{{ s.recipient_name }}</td> }
                        @if (isColumnVisible('origen')) { <td style="font-size:.83rem;">{{ s.origin_city }}</td> }
                        @if (isColumnVisible('destino')) { <td style="font-size:.83rem;">{{ s.destination_city }}</td> }
                        @if (isColumnVisible('peso')) { <td style="font-size:.83rem;">{{ s.weight_kg }} kg</td> }
                        @if (isColumnVisible('costo')) { <td style="font-size:.83rem;font-weight:600;color:var(--accent);">Q{{ s.estimated_cost }}</td> }
                        @if (isColumnVisible('estado')) { <td><app-status-badge [status]="s.current_status" /></td> }
                        
                        @if (isColumnVisible('acciones')) {
                          <td>
                            <!-- Dropdown Acciones -->
                            <div class="dropdown-container" style="position:relative; display:inline-block;">
                              <button (click)="toggleDropdown(s.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                              <div class="dropdown-menu" 
                                   [class.dropup]="i === filteredShipments.length - 1 && filteredShipments.length > 2"
                                   [style.display]="openDropdownId === s.id ? 'block' : 'none'">
                                 <a [routerLink]="['/cliente/ver-solicitud', s.id]" class="dropdown-item">
                                   <span class="material-symbols-outlined">visibility</span> Ver Solicitud
                                 </a>
                                 <a (click)="imprimirGuia(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id ? 0.6 : 1">
                                   <span class="material-symbols-outlined">print</span> 
                                   {{ generatingPdfId === s.id ? 'Generando...' : 'Imprimir Guía' }}
                                 </a>
                                 <a (click)="imprimirFormulario(s)" class="dropdown-item">
                                   <span class="material-symbols-outlined">description</span> Formulario
                                 </a>
                              </div>
                            </div>
                          </td>
                        }
                      </tr>
                    }
                    @if (filteredShipments.length === 0) {
                      <tr><td [attr.colspan]="columnConfigs.length + 1" style="padding:0;">
                        <div class="nx-empty search-empty animate-fade-in">
                          <div class="robot-confused">
                            <span class="material-symbols-outlined robot-icon">smart_toy</span>
                            <div class="robot-bubbles"><span>?</span><span>!</span></div>
                          </div>
                          <h3>no encontré nada :(</h3>
                          <p>Verifica los términos de búsqueda o los filtros activos</p>
                          <button class="nx-btn btn-ghost" (click)="clearFilters()" style="margin-top:1rem;">Limpiar filtros</button>
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
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ printShipment.order_number || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Orden</div></div>
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ printShipment.ticket_number || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Ticket</div></div>
                </div>
              </div>
            </div>

            <!-- Row 2: DESTINATARIO -->
            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ printShipment.recipient_name || printShipment.recipientName }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ printShipment.recipient_phone || printShipment.recipientPhone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dir: {{ printShipment.recipient_address || printShipment.recipientAddress }}, {{ printShipment.recipient_municipality || printShipment.destination_city }}, {{ printShipment.recipient_department || '' }} {{ printShipment.recipient_zone || '' }}</div>
                <div style="font-size: 11px; font-weight: 700; margin-top:2px; color: black;">
                  {{ printShipment.payment_instructions || 'Favor Cobrar Q' + (printShipment.total_payment_amount || '0.00') + ' con envío incluido' }}
                </div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">{{ printShipment.service_tag || 'DOM' }}</div>
              </div>
            </div>

            <!-- Row 3: MIDDLE SECTION (BARCODE) -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black; font-family: monospace;">Guía No.<br>{{ getTrackingPrefix(printShipment) }}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 5px;">
                <svg id="barcodeCanvas"></svg>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="flex:1; border-bottom: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                  PIEZA<br><span style="font-size: 28px; line-height: 1;">01</span>DE<br><span style="font-size: 24px; line-height: 0.8;">{{ (printShipment.quantity || 1) | number:'2.0' }}</span>
                </div>
              </div>
            </div>

            <!-- Row 4: GUA SECTION -->
            <div style="display:flex; border-bottom: 2px solid black; height: 110px; align-items:stretch;">
              <div style="flex:1; display:flex; align-items:center; padding: 5px; gap: 10px;">
                <div style="border: 3px solid black; font-size: 64px; font-weight: 900; padding: 4px 10px; line-height: 1; color: black;">{{ printShipment.destination_code || 'GUA' }}</div>
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
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ getDeptCode(printShipment) }}</div>
                <div style="font-size: 7px; font-weight: bold;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ printShipment.recipient_municipality || printShipment.destination_city || 'Xela' }}</div>
                <div style="font-size: 7px; font-weight: bold;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 20px; font-weight: 900; line-height: 1;">{{ printShipment.recipient_zone || 'S/D' }}</div>
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
    .nx-page-header { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
    .header-main-row { display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 1rem; }
    .header-actions-row { display: flex; align-items: center; gap: 1rem; width: 100%; flex-wrap: wrap; }
    
    /* Search box */
    .search-box { position: relative; display: flex; align-items: center; min-width: 300px; flex: 1; }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
    .search-input { padding-left: 40px !important; width: 100%; height: 45px; background: rgba(0,0,0,0.3) !important; border-color: rgba(255,255,255,0.1) !important; font-size: 0.95rem; }
    .search-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important; background: rgba(0,0,0,0.4) !important; }

    /* KPI Interactivity */
    .nx-kpi-card { cursor: pointer; transition: all var(--tr); border: 2px solid transparent; }
    .nx-kpi-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.03); }
    .nx-kpi-card.active { 
      border-color: var(--primary); 
      background: rgba(99, 102, 241, 0.15); 
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.25), inset 0 0 10px rgba(99, 102, 241, 0.1);
      transform: scale(1.02);
      z-index: 2;
    }

    /* Date Picker */
    .date-picker-container { position: relative; }
    .btn-date-picker { 
      background: linear-gradient(135deg, #5d1d88ff 0%, #5d1d88ff 100%) !important; 
      border: 1px solid rgba(255,255,255,0.2) !important; 
      color: white !important; font-weight: 800; font-size: 0.85rem; padding: 0 20px; height: 45px;
      display: flex; align-items: center; gap: 10px; border-radius: 12px !important; 
      box-shadow: 0 4px 15px rgba(26, 22, 92, 0.3); transition: all 0.3s;
      cursor: pointer;
    }
    .btn-date-picker:hover { 
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
      filter: brightness(1.1);
    }
    .btn-date-picker.active { 
      background: linear-gradient(135deg, #5d1d88ff 0%, #5d1d88ff 100%) !important;
      transform: scale(0.98);
    }
    .btn-date-picker .arrow { font-size: 1.2rem; transition: transform 0.3s; color: #9ca3af; }
    
    .month-picker-dropdown {
      position: absolute; top: calc(100% + 8px); left: 0; z-index: 120;
      background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 16px; min-width: 280px;
      backdrop-filter: blur(20px); transform-origin: top left;
    }
    .picker-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
    .picker-year { font-size: 1.1rem; font-weight: 900; color: white; }
    .nav-btn { background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 8px; cursor: pointer; padding: 4px; display: flex; transition: all 0.2s; }
    .nav-btn:hover { background: var(--primary); color: white; }
    
    .month-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .month-item { 
      background: rgba(255,255,255,0.03); border: 1px solid transparent; color: #9ca3af; 
      padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700;
      text-align: center; transition: all 0.2s; text-transform: uppercase;
    }
    .month-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .month-item.selected { background: var(--primary); color: white; border-color: transparent; }

    .filter-btn { 
      background: none; border: none; padding: 0; color: inherit; cursor: pointer; display: inline-flex; align-items: center;
      transition: color 0.2s;
    }
    .filter-btn:hover, .filter-btn.active { color: var(--primary); }
    .filter-ico { font-size: 16px; margin-left: 6px; opacity: 0.7; }

    .col-filter-input { 
      margin-top: 8px; 
      height: 30px !important; 
      font-size: 0.75rem !important; 
      padding: 0 8px !important; 
      background: rgba(0,0,0,0.5) !important; 
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: white !important;
      width: 100%;
    }

    /* Action Utils */
    .table-tools { display: flex; gap: 10px; margin-left: auto; position: relative; }
    .btn-columns { background: #6366F1 !important; color: white !important; }
    .btn-export { background: #059669 !important; color: white !important; }
    
    .columns-dropdown {
      position: absolute; top: calc(100% + 5px); right: 0; z-index: 110;
      background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
      border-radius: var(--radius-sm); box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      padding: 12px; min-width: 200px; backdrop-filter: blur(10px);
    }
    .column-opt { display: flex; align-items: center; gap: 10px; padding: 6px 0; color: white; cursor: pointer; font-size: 0.9rem; }
    .column-opt input { cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary); }

    .nx-table-wrap { 
      overflow-x: auto; 
      -webkit-overflow-scrolling: touch; 
      min-height: 250px; /* Space for dropdowns even with 1 row */
    }

    /* ROBOT CONFUSED EMPTY STATE */
    .search-empty { 
      padding: 6rem 2rem; color: var(--text-muted); 
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 450px; width: 100%; text-align: center;
    }
    .robot-confused { position: relative; font-size: 5.5rem; color: var(--primary); margin-bottom: 2rem; display: inline-block; }
    .robot-icon { font-size: inherit; }
    .robot-bubbles { position: absolute; top: 0; right: -20px; font-weight: 800; font-size: 1.5rem; }
    .robot-bubbles span { position: absolute; animation: floatBubble 2s infinite ease-in-out; }
    .robot-bubbles span:nth-child(1) { left: 0; top: -10px; animation-delay: 0s; color: var(--accent); }
    .robot-bubbles span:nth-child(2) { left: 20px; top: 10px; animation-delay: 0.5s; color: var(--primary); }

    @keyframes floatBubble { 
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
      50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
    }

    /* Dropdown menu */
    .dropdown-container .dropdown-menu {
      position: absolute; 
      left: calc(100% + 10px); 
      top: -10px; 
      z-index: 100;
      background: #1e293b; 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      border-radius: var(--radius-sm); 
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); 
      min-width: 190px; 
      text-align: left; 
      overflow: hidden;
      backdrop-filter: blur(8px);
    }
    .dropdown-container .dropdown-menu.dropup {
      top: auto;
      bottom: -10px;
    }
    .dropdown-item {
      display: flex; 
      align-items: center; 
      width: 100%; 
      text-align: left; 
      background: none; 
      border: none; 
      padding: 12px 16px; 
      color: rgba(255, 255, 255, 0.8); 
      cursor: pointer; 
      text-decoration: none; 
      font-size: 14px;
      transition: all var(--tr-fast);
      gap: 10px;
    }
    .dropdown-item:hover { 
      background: rgba(255, 255, 255, 0.05); 
      color: var(--primary); 
    }
    .dropdown-item .material-symbols-outlined {
      font-size: 18px;
    }

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

  searchText: string = '';
  activeStatusFilter: string | null = null;

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  tempYear: number = this.selectedYear;
  isMonthMenuOpen: boolean = false;

  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];
  monthsShort = [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ];
  years: number[] = [2025, 2026, 2027];

  columnConfigs = [
    { key: 'guia', label: 'Guía', visible: true },
    { key: 'fecha', label: 'Fecha', visible: true },
    { key: 'remitente', label: 'Remitente', visible: false },
    { key: 'destinatario', label: 'Destinatario', visible: false },
    { key: 'origen', label: 'Origen', visible: true },
    { key: 'destino', label: 'Destino', visible: true },
    { key: 'peso', label: 'Peso', visible: true },
    { key: 'costo', label: 'Costo est.', visible: true },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true }
  ];

  isColumnMenuOpen = false;

  columnFilters = {
    tracking: '',
    origen: '',
    destino: '',
    status: ''
  };

  showFilters = {
    tracking: false,
    origen: false,
    destino: false,
    status: false
  };

  get filteredShipments(): any[] {
    if (!this.shipments) return [];
    let result = [...this.shipments];

    // Status Filter (from KPIs)
    if (this.activeStatusFilter) {
      result = result.filter(s => s.current_status === this.activeStatusFilter);
    }
    // ... filtering continues in next chunk

    // Column Filters (Excel style)
    if (this.columnFilters.tracking) {
      const q = this.columnFilters.tracking.toLowerCase();
      result = result.filter(s => s.tracking_number?.toLowerCase().includes(q));
    }
    if (this.columnFilters.origen) {
      const q = this.columnFilters.origen.toLowerCase();
      result = result.filter(s => s.origin_city?.toLowerCase().includes(q));
    }
    if (this.columnFilters.destino) {
      const q = this.columnFilters.destino.toLowerCase();
      result = result.filter(s => s.destination_city?.toLowerCase().includes(q));
    }
    if (this.columnFilters.status) {
      const q = this.columnFilters.status.toLowerCase();
      result = result.filter(s => s.current_status?.toLowerCase().includes(q));
    }

    // Global Search Filter
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      result = result.filter(s =>
        (s.tracking_number?.toLowerCase().includes(q)) ||
        (s.origin_city?.toLowerCase().includes(q)) ||
        (s.destination_city?.toLowerCase().includes(q)) ||
        (s.sender_name?.toLowerCase().includes(q)) ||
        (s.recipient_name?.toLowerCase().includes(q)) ||
        (s.current_status?.toLowerCase().includes(q))
      );
    }

    return result;
  }

  constructor(private shipmentService: ShipmentService) { }

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.loading = true;
    this.shipmentService.getShipments({
      month: this.selectedMonth,
      year: this.selectedYear,
      limit: 100
    }).subscribe({
      next: (r) => {
        this.shipments = r.data.data;
        this.total = r.data.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  toggleMonthMenu(event: Event) {
    event.stopPropagation();
    this.isMonthMenuOpen = !this.isMonthMenuOpen;
    this.tempYear = this.selectedYear;
  }

  changeTempYear(delta: number) {
    this.tempYear += delta;
  }

  selectMonth(monthValue: number) {
    this.selectedMonth = monthValue;
    this.selectedYear = this.tempYear;
    this.isMonthMenuOpen = false;
    this.loadShipments();
  }

  getSelectedDateLabel(): string {
    const m = this.months.find(m => m.value === this.selectedMonth);
    return `${m?.label || ''} ${this.selectedYear}`;
  }

  clearFilters() {
    this.searchText = '';
    this.activeStatusFilter = null;
    this.columnFilters = { tracking: '', origen: '', destino: '', status: '' };
    this.loadShipments(); // Recargar con mes actual si se desea, o mantener el mes? El usuario pidió limpiar
  }

  countByStatus(status: string): number {
    return this.shipments.filter((s: any) => s.current_status === status).length;
  }

  toggleStatusFilter(status: string) {
    if (this.activeStatusFilter === status) {
      this.activeStatusFilter = null;
    } else {
      this.activeStatusFilter = status;
    }
  }

  toggleColumnFilter(col: 'tracking' | 'origen' | 'destino' | 'status') {
    this.showFilters[col] = !this.showFilters[col];
  }

  toggleColumnMenu(event: Event) {
    event.stopPropagation();
    this.isColumnMenuOpen = !this.isColumnMenuOpen;
  }

  isColumnVisible(key: string): boolean {
    return this.columnConfigs.find(c => c.key === key)?.visible || false;
  }

  exportToExcel() {
    const dataToExport = this.filteredShipments.map(s => ({
      'Guía': s.tracking_number,
      'Fecha': new Date(s.created_at).toLocaleDateString(),
      'Remitente': s.sender_name || '-',
      'Destinatario': s.recipient_name || '-',
      'Origen': s.origin_city,
      'Destino': s.destination_city,
      'Peso (kg)': s.weight_kg,
      'Costo (Q)': s.estimated_cost,
      'Estado': s.current_status,
      'Descripción': s.description || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Envíos');

    const fileName = `Nexgo_Envios_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.openDropdownId = null;
    }
    if (!target.closest('.table-tools')) {
      this.isColumnMenuOpen = false;
      this.isMonthMenuOpen = false;
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

  getTrackingPrefix(s: any): string {
    if (!s) return '';
    const t = s.tracking_number || s.trackingNumber || '';
    return t.toString().substring(0, 12);
  }

  getDeptCode(s: any): string {
    if (!s) return 'GUA';
    const d = s.recipient_department || 'GUA';
    return d.toString().substring(0, 3).toUpperCase();
  }
}
