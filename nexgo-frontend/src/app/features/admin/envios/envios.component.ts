import { Component, OnInit, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
  selector: 'app-envios-admin',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink, FormsModule],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom;">inventory_2</span> 
            Gestión de Envíos
          </span>
        </div>
        <div class="nx-content">
          <div class="nx-page-header">
            <div class="header-main-row">
              <div>
                <h1>Panel de Control de Envíos</h1>
                <p>Monitoreo y gestión de todos los envíos registrados en el sistema</p>
              </div>
            </div>
            <div class="header-actions-row">
              <div class="search-box">
                <span class="material-symbols-outlined search-icon">search</span>
                <input type="text" [(ngModel)]="searchText" placeholder="Buscar por guía, cliente, origen, destino, remitente..." class="nx-input search-input" />
              </div>
              
              <div class="table-tools">
                <!-- 1. Boton de Fecha -->
                <div class="date-picker-container" (click)="$event.stopPropagation()">
                  <button class="nx-btn btn-date-picker" (click)="toggleMonthMenu($event)" [class.active]="isMonthMenuOpen">
                    <span class="material-symbols-outlined">calendar_month</span>
                    {{ getSelectedDateLabel() }}
                    <span class="material-symbols-outlined arrow" [style.transform]="isMonthMenuOpen ? 'rotate(180deg)' : 'none'">expand_more</span>
                  </button>

                  @if (isMonthMenuOpen) {
                    <div class="month-picker-dropdown animate-scale-up">
                      <div class="picker-header">
                         <div style="display: flex; align-items: center; gap: 8px;">
                            @if (!isDayView || dateSelectionMode === 'MONTH') {
                              <button class="nav-btn" (click)="changeTempYear(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
                              <span class="picker-year">{{ tempYear }}</span>
                              <button class="nav-btn" (click)="changeTempYear(1)"><span class="material-symbols-outlined">chevron_right</span></button>
                            } @else {
                              <button class="nav-btn" (click)="changeTempMonth(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
                              <span class="picker-year" style="font-size: 0.9rem; min-width: 80px; text-align: center;">{{ getMonthName(tempMonth) }} {{ tempYear }}</span>
                              <button class="nav-btn" (click)="changeTempMonth(1)"><span class="material-symbols-outlined">chevron_right</span></button>
                            }
                         </div>
                         <div class="picker-mode-toggle">
                            <button [class.active]="dateSelectionMode === 'MONTH'" (click)="setPickerMode('MONTH')">Mes</button>
                            <button [class.active]="dateSelectionMode === 'DAY'" (click)="setPickerMode('DAY')">Día</button>
                         </div>
                      </div>

                      @if (!isDayView || dateSelectionMode === 'MONTH') {
                        <div class="month-grid">
                          @for (m of monthsShort; track m.value) {
                            <button class="month-item" 
                                    [class.selected]="selectedMonth === m.value && selectedYear === tempYear && dateSelectionMode === 'MONTH'"
                                    (click)="handleMonthClick(m.value)">
                               {{ m.label }}
                            </button>
                          }
                        </div>
                      } @else {
                        <div class="day-grid">
                          @for (d of getDaysInMonth(tempMonth, tempYear); track d) {
                            <button class="day-item" 
                                    [class.selected]="selectedDay === d && selectedMonth === tempMonth && selectedYear === tempYear"
                                    (click)="selectDay(d)">
                               {{ d }}
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- 2. Menu de Opciones -->
                <div class="options-dropdown-container" (click)="$event.stopPropagation()">
                  <button class="nx-btn btn-options" (click)="toggleOptionsMenu($event)" [class.active]="isOptionsMenuOpen">
                    <span class="material-symbols-outlined">settings</span>
                    Acciones
                    <span class="material-symbols-outlined">{{ isOptionsMenuOpen ? 'expand_less' : 'expand_more' }}</span>
                  </button>

                  @if (isOptionsMenuOpen) {
                    <div class="options-menu animate-scale-up" (click)="$event.stopPropagation()">
                      <button class="options-item" (click)="exportToExcel()">
                        <span class="material-symbols-outlined">download</span>
                        Exportar Excel
                      </button>
                      <button class="options-item" (click)="isColumnMenuOpen = !isColumnMenuOpen">
                        <span class="material-symbols-outlined">view_column</span>
                        Gestionar Columnas
                      </button>

                      @if (isColumnMenuOpen) {
                        <div class="columns-nested animate-fade-in" style="padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-top: 4px;">
                          @for (col of columnConfigs; track col.key) {
                            <label class="column-opt" style="display: flex; align-items: center; gap: 10px; padding: 4px 0; color: #94a3b8; font-size: 0.8rem; cursor: pointer;">
                              <input type="checkbox" [(ngModel)]="col.visible" style="accent-color:var(--primary); cursor:pointer;" />
                              <span>{{ col.label }}</span>
                            </label>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Stats row -->
          <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'PENDIENTE'" (click)="toggleStatusFilter('PENDIENTE')">
              <div class="kpi-label">Pendientes</div>
              <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">pending_actions</span>
            </div>
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'RECOGIDO'" (click)="toggleStatusFilter('RECOGIDO')">
              <div class="kpi-label">Recogidos</div>
              <div class="kpi-value" style="color:#a855f7;">{{ countByStatus('RECOGIDO') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">package_2</span>
            </div>
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'EN_TRANSITO'" (click)="toggleStatusFilter('EN_TRANSITO')">
              <div class="kpi-label">En tránsito</div>
              <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">local_shipping</span>
            </div>
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'EN_DESTINO'" (click)="toggleStatusFilter('EN_DESTINO')">
              <div class="kpi-label">En destino</div>
              <div class="kpi-value" style="color:#f472b6;">{{ countByStatus('EN_DESTINO') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">distance</span>
            </div>
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'ENTREGADO'" (click)="toggleStatusFilter('ENTREGADO')">
              <div class="kpi-label">Entregados</div>
              <div class="kpi-value" style="color:var(--status-delivered);">{{ countByStatus('ENTREGADO') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">check_circle</span>
            </div>
            <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'CANCELADO'" (click)="toggleStatusFilter('CANCELADO')">
              <div class="kpi-label">Cancelados</div>
              <div class="kpi-value" style="color:#ef4444;">{{ countByStatus('CANCELADO') }}</div>
              <span class="material-symbols-outlined kpi-bg-icon">cancel</span>
            </div>
          </div>

          <div class="nx-card" style="padding:0;">
            <div class="nx-table-wrap">
              <table class="nx-table">
                <thead><tr>
                  @if (isColumnVisible('guia')) {
                    <th style="text-align: center;">
                      <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                        Guía 
                        <button class="filter-btn" [class.active]="showFilters.tracking" (click)="$event.stopPropagation(); toggleColumnFilter('tracking')">
                          <span class="material-symbols-outlined filter-ico">filter_alt</span>
                        </button>
                      </div>
                      @if (showFilters.tracking) {
                        <input [(ngModel)]="columnFilters.tracking" class="nx-input col-filter-input" placeholder="Filtrar..." (click)="$event.stopPropagation()" />
                      }
                    </th>
                  }
                  @if (isColumnVisible('cliente')) {
                    <th style="text-align: center;">
                      <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                        Cliente
                        <button class="filter-btn" [class.active]="showFilters.cliente" (click)="$event.stopPropagation(); toggleColumnFilter('cliente')">
                          <span class="material-symbols-outlined filter-ico">filter_alt</span>
                        </button>
                      </div>
                      @if (showFilters.cliente) {
                        <input [(ngModel)]="columnFilters.cliente" class="nx-input col-filter-input" placeholder="Filtrar..." (click)="$event.stopPropagation()" />
                      }
                    </th>
                  }
                  @if (isColumnVisible('remitente')) { <th style="text-align: center;">Remitente</th> }
                  @if (isColumnVisible('destinatario')) { <th style="text-align: center;">Destinatario</th> }
                  @if (isColumnVisible('fecha')) { <th style="text-align: center;">Fecha</th> }
                  @if (isColumnVisible('origen')) { <th style="text-align: center;">Origen</th> }
                  @if (isColumnVisible('destino')) { <th style="text-align: center;">Destino</th> }
                  @if (isColumnVisible('peso')) { <th style="text-align: center;">Peso</th> }
                  @if (isColumnVisible('costo')) { <th style="text-align: center;">Costo</th> }
                  @if (isColumnVisible('estado')) { <th style="text-align: center;">Estado</th> }
                  @if (isColumnVisible('acciones')) { <th class="actions-column">ACCIONES</th> }
                </tr></thead>
                <tbody>
                  @for (s of filteredShipments; track s.id; let i = $index) {
                    <tr>
                      @if (isColumnVisible('guia')) { 
                        <td>
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <span class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</span>
                            <button (click)="copyToClipboard(s.tracking_number)" class="copy-btn" title="Copiar guía">
                              <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>
                            </button>
                          </div>
                        </td> 
                      }
                      @if (isColumnVisible('cliente')) { 
                        <td style="font-size:.83rem;">{{ s.company_name || s.client_name }}</td> 
                      }
                      @if (isColumnVisible('remitente')) { <td style="font-size:.83rem;">{{ s.sender_name }}</td> }
                      @if (isColumnVisible('destinatario')) { <td style="font-size:.83rem;">{{ s.recipient_name }}</td> }
                      @if (isColumnVisible('fecha')) { <td style="font-size:.8rem; text-align:center;">{{ s.created_at | date:'dd/MM/yy' }}</td> }
                      @if (isColumnVisible('origen')) { <td style="font-size:.83rem; text-align:center;">{{ s.origin_city }}</td> }
                      @if (isColumnVisible('destino')) { <td style="font-size:.83rem; text-align:center;">{{ s.destination_city }}</td> }
                      @if (isColumnVisible('peso')) { <td style="font-size:.83rem; text-align:center;">{{ s.weight_kg }} kg</td> }
                      @if (isColumnVisible('costo')) { <td style="font-size:.83rem;font-weight:600;color:var(--accent); text-align:center;">Q{{ s.estimated_cost | number:'1.2-2' }}</td> }
                      @if (isColumnVisible('estado')) { <td style="text-align:center;"><app-status-badge [status]="s.current_status" /></td> }

                      
                      @if (isColumnVisible('acciones')) {
                        <td>
                          <div class="dropdown-container" style="position:relative; display:inline-block;">
                            <button (click)="toggleDropdown(s.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                            <div class="dropdown-menu" 
                                 [class.dropup]="i === filteredShipments.length - 1 && filteredShipments.length > 2"
                                 [style.display]="openDropdownId === s.id ? 'block' : 'none'">
                               <a [routerLink]="['/cliente/ver-solicitud', s.id]" class="dropdown-item">
                                 <span class="material-symbols-outlined">visibility</span> Ver Solicitud
                               </a>
                               <button (click)="viewDetail(s)" class="dropdown-item">
                                 <span class="material-symbols-outlined">edit_square</span> Actualizar Estado
                               </button>
                               <div class="dropdown-divider"></div>
                               <button (click)="imprimirGuia(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id && printMode === 'guia' ? 0.6 : 1">
                                 <span class="material-symbols-outlined">print</span> 
                                 {{ (generatingPdfId === s.id && printMode === 'guia') ? 'Generando...' : 'Imprimir Guía' }}
                               </button>
                               <button (click)="imprimirFormulario(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id && printMode === 'formulario' ? 0.6 : 1">
                                 <span class="material-symbols-outlined">description</span> 
                                 {{ (generatingPdfId === s.id && printMode === 'formulario') ? 'Generando...' : 'Generar Manifiesto' }}
                               </button>
                            </div>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                  @if (filteredShipments.length === 0) {
                    <tr><td [attr.colspan]="columnConfigs.length" style="padding:0;">
                      <div class="nx-empty search-empty">
                        <div class="robot-confused"><span class="material-symbols-outlined robot-icon">smart_toy</span></div>
                        <h3>No se encontraron envíos</h3>
                        <p>Ajusta los filtros o los términos de búsqueda</p>
                        <button class="nx-btn btn-ghost" (click)="clearFilters()" style="margin-top:1rem;">Limpiar filtros</button>
                      </div>
                    </td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Detalle / Actualizar Estado Modal -->
    @if (selected) {
      <div class="nx-modal-backdrop" (click)="selected=null">
        <div class="nx-modal animate-scale-up" style="max-width:620px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Actualizar Envío {{ selected.tracking_number }}</h3>
            <button class="close-btn" (click)="selected=null"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="modal-body">
            <div class="nx-form-row cols-2">
              <div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.25rem;">REMITENTE</div>
                <div style="font-weight:600;">{{ selected.sender_name }}</div>
                <div style="font-size:.83rem;color:var(--text-muted);">{{ selected.origin_city }}</div>
              </div>
              <div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.25rem;">DESTINATARIO</div>
                <div style="font-weight:600;">{{ selected.recipient_name }}</div>
                <div style="font-size:.83rem;color:var(--text-muted);">{{ selected.destination_city }}</div>
              </div>
            </div>
            <hr class="divider">
            <div class="nx-form-row cols-3">
              <div><div class="text-muted" style="font-size:.75rem;">PESO</div><div style="font-weight:600;">{{ selected.weight_kg }} kg</div></div>
              <div><div class="text-muted" style="font-size:.75rem;">COSTO</div><div style="font-weight:600;color:var(--accent);">Q{{ selected.estimated_cost }}</div></div>
              <div><div class="text-muted" style="font-size:.75rem;">CLIENTE</div><div style="font-weight:600;">{{ selected.company_name || selected.client_name }}</div></div>
            </div>
            <hr class="divider">
            <div class="nx-form-group">
              <label>Nuevo Estado</label>
              <div style="display:flex;gap:.75rem;">
                <select class="nx-input" [(ngModel)]="newStatus">
                  @for (s of statuses; track s) { <option [value]="s">{{ getStatusLabel(s) }}</option> }
                </select>
                <button class="nx-btn btn-primary" (click)="updateStatus()">Actualizar Estado</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ZONA IMPRESIÓN (OCULTA) -->
    @if (printMode === 'guia' && printShipment) {
      <div class="print-guia-container">
        <div style="display: flex; justify-content: center; align-items: center; background: white; width: 100mm; height: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 3px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif; position: relative; padding: 6px;">
            <div style="border: 2px solid black; flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Row 1: REMITENTE -->
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center;">
                <div style="background: black; color: white; font-size: 7px; font-weight: 900; padding: 1px 10px; text-transform: uppercase; letter-spacing: 1px;">Remitente</div>
              </div>
              <div style="display: flex; height: 55px; border-bottom: 2px solid black;">
                <div style="flex:1; padding: 2px 4px; display:flex; flex-direction:column; justify-content:center; font-size: 8px; line-height: 1.1;">
                  <div>Nombre: {{ printShipment.sender_name }}</div>
                  <div>Tel: {{ printShipment.sender_phone }}</div>
                  <div>Correo: {{ printShipment.client_email || 'info@nexgo.com' }}</div>
                  <div>Empresa: {{ printShipment.company_name || 'Nexgo Customer' }}</div>
                </div>
                <div style="width: 170px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px;">
                  <div style="text-align:center; margin-bottom: 2px;">
                    <div style="font-size:12px; font-weight:900; line-height:1; color: black; font-family: 'Arial Black', sans-serif;">Nacionales</div>
                    <div style="font-size:5px; font-weight:bold; color: #333; letter-spacing: 0.5px;">Delivery Services</div>
                  </div>
                  <div style="display:flex; gap:12px; width: 90%; justify-content: center;">
                    <div style="text-align:center;"><div style="font-size:12px; font-weight:900; color: black; line-height:1;">{{ printShipment.order_number || '0' }}</div><div style="font-size:5px; font-weight:bold; color: black;">No. Orden</div></div>
                    <div style="text-align:center;"><div style="font-size:12px; font-weight:900; color: black; line-height:1;">{{ printShipment.ticket_number || '0' }}</div><div style="font-size:5px; font-weight:bold; color: black;">No. Ticket</div></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 2: DESTINATARIO -->
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center;">
                <div style="background: black; color: white; font-size: 7px; font-weight: 900; padding: 1px 10px; text-transform: uppercase; letter-spacing: 1px;">Destinatario</div>
              </div>
              <div style="display: flex; height: 75px; border-bottom: 2px solid black;">
                <div style="flex:1; padding: 2px 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden; font-size: 8px; line-height: 1.1;">
                  <div style="margin-bottom: 1px;">Nombre: {{ printShipment.recipient_name }}</div>
                  <div>Tel: {{ printShipment.recipient_phone }}</div>
                  <div>Dir: {{ printShipment.recipient_address }}, {{ printShipment.recipient_municipality }}, {{ printShipment.recipient_department }}</div>
                  <div style="font-size: 8.5px; margin-top:2px; color: black; border-top: 1px dashed black; padding-top: 2px;">
                    Indicaciones: {{ printShipment.payment_instructions || 'Favor Cobrar Q' + (printShipment.total_payment_amount || '0.00') + ' con envío incluido' }}
                  </div>
                </div>
                <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: white;">
                  <div style="border: 2px solid black; font-size: 20px; font-weight: 900; padding: 6px 4px; color: black; line-height: 1;">{{ printShipment.service_tag || 'DOM' }}</div>
                </div>
              </div>
            </div>

            <!-- Row 3: TRACKING & PIEZA -->
            <div style="display:flex; border-bottom: 2px solid black; height: 80px; align-items:stretch;">
              <!-- Col 1: No. Guía -->
              <div style="flex:1; display:flex; flex-direction:column;">
                <div style="display: flex; align-items: center;">
                  <div style="background: black; color: white; font-size: 7px; font-weight: 900; padding: 1px 10px; text-transform: uppercase; letter-spacing: 1px;">No. Guía</div>
                </div>
                <div style="flex:1; display:flex; align-items:center; justify-content:flex-start; padding-left: 10px; font-size: 19px; font-weight: 900; color: black; font-family: 'Arial Black', sans-serif;">
                   {{ printShipment.tracking_number }}
                </div>
              </div>
              <!-- Col 2: Pieza Boxed -->
              <div style="width: 140px; display: flex; align-items: center; justify-content: center; padding: 6px;">
                <div style="border: 2.5px solid black; width: 100%; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white;">
                  <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1; margin-bottom: 3px;">Piezas</div>
                  <div style="font-size: 20px; font-weight: 900; color: black; display: flex; gap: 8px; align-items: center;">
                    <span>{{ currentPieceCount }}</span>
                    <span style="font-size: 10px;">DE</span>
                    <span>{{ totalPiecesCount }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 4: DESTINATION & WEIGHT & PAYMENT -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="flex:1.4; display:flex; align-items:center; padding: 4px; gap: 8px;">
                <div style="border: 2.5px solid black; font-size: 36px; font-weight: 900; padding: 2px 8px; line-height: 0.9; color: black; font-family: 'Arial Black', sans-serif; min-width: 70px; text-align: center;">{{ printShipment.destination_code || 'GUA' }}</div>
                <div style="font-size: 9px; font-weight: 900; line-height: 1.1; color: black; text-transform: uppercase;">GT:<br>Paquete<br>Pequeño</div>
              </div>
              <div style="flex:1; border-left:2px solid black; display: flex; flex-direction: column;">
                <!-- Peso -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 2px solid black; background: white;">
                  <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1;">PESO lb</div>
                  <div style="font-size: 20px; font-weight: 900; color: black; line-height: 1;">{{ printShipment.weight_kg }}</div>
                </div>
                <!-- Forma Pago & Servicio -->
                <div style="display: flex; flex: 1;">
                  <div style="flex: 1; border-right: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white;">
                    <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1;">Forma Pago</div>
                    <div style="font-size: 14px; font-weight: 900; color: black; line-height: 1;">COLLECT</div>
                  </div>
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white;">
                    <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1;">Servicio</div>
                    <div style="font-size: 14px; font-weight: 900; color: black; line-height: 1;">COD</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 5: FOOTER (Black Bar) -->
            <div style="display:flex; height: 22px; background: black; color: white;">
              <div style="flex:1; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 11px; font-weight: 900; line-height: 1; font-family: 'Arial Black', sans-serif;">{{ getDeptCode(printShipment) }}</div>
                <div style="font-size: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 11px; font-weight: 900; line-height: 1; text-transform: uppercase; font-family: 'Arial Black', sans-serif; letter-spacing: 0.5px;">{{ printShipment.recipient_municipality || 'Guatemala' }}</div>
                <div style="font-size: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 12px; font-weight: 900; line-height: 1; font-family: 'Arial Black', sans-serif;">{{ printShipment.recipient_zone || '0' }}</div>
                <div style="font-size: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">Zona</div>
              </div>
            </div>

            <div style="font-size: 4px; text-align: center; color: black; background: white; font-weight: bold; padding: 1px 0;">** Guía sujeta a términos y condiciones de Nexgo **</div>
            </div><!-- end inner border wrapper -->
          </div>
        </div>
      </div>
    }

    @if (printMode === 'formulario' && printShipment) {
      <div class="print-manifest-container" style="background: white !important;">
        <div #manifestContainer class="manifest-doc">
           <h2 style="text-align:center;">MANIFIESTO DE CARGA - NEXGO</h2>
           <hr>
           <p><b>Guía:</b> {{ printShipment.tracking_number }}</p>
           <p><b>Fecha:</b> {{ printShipment.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
           <p><b>Cliente:</b> {{ printShipment.company_name || printShipment.client_name }}</p>
           <hr>
           <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4>REMITENTE</h4>
                <p>{{ printShipment.sender_name }}</p>
                <p>{{ printShipment.origin_city }}</p>
              </div>
              <div>
                <h4>DESTINATARIO</h4>
                <p>{{ printShipment.recipient_name }}</p>
                <p>{{ printShipment.destination_city }}</p>
              </div>
           </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .nx-page-header { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
    .header-main-row { display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 1rem; }
    .header-actions-row { display: flex; align-items: center; gap: 1rem; width: 100%; flex-wrap: wrap; }
    
    .search-box { flex: 1; min-width: 300px; display: flex; align-items: center; position: relative; }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
    .search-input { padding-left: 40px !important; width: 100%; height: 45px; background: rgba(0,0,0,0.4) !important; border-radius: 12px !important; }

    .nx-kpi-card { cursor: pointer; transition: all var(--tr); border: 2px solid transparent; position: relative; overflow: hidden; padding: 1.25rem !important; }
    .nx-kpi-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.03); }
    .nx-kpi-card.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.15); transform: scale(1.02); }

    .kpi-bg-icon { position: absolute; right: -10px; bottom: -10px; font-size: 5rem !important; opacity: 0.1; transform: rotate(-10deg); }

    /* Date Picker & Options UI ported from MisEnvios */
    .table-tools { display: flex; align-items: center; gap: 12px; }
    .date-picker-container, .options-dropdown-container { position: relative; }
    
    .btn-date-picker, .btn-options { 
      background: #5d1d88ff !important; border: 1px solid rgba(255,255,255,0.2) !important; 
      color: white !important; font-weight: 700; height: 45px; padding: 0 16px; border-radius: 12px !important;
      display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
    }
    .btn-date-picker:hover, .btn-options:hover { filter: brightness(1.1); transform: translateY(-2px); }

    .month-picker-dropdown, .options-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 500;
      background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 16px; min-width: 280px;
      backdrop-filter: blur(20px); transform-origin: top right;
    }
    .month-picker-dropdown { left: 0; transform-origin: top left; }

    .picker-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .nav-btn { 
      background: rgba(255,255,255,0.05); border: none; color: white; 
      width: 32px; height: 32px; border-radius: 8px; display: flex; 
      align-items: center; justify-content: center; cursor: pointer;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.1); }
    .picker-year { font-weight: 800; color: white; font-size: 1.1rem; min-width: 60px; text-align: center; }

    .picker-mode-toggle { 
      background: rgba(0,0,0,0.3); padding: 4px; border-radius: 10px; display: flex; gap: 4px;
    }
    .picker-mode-toggle button {
      background: none; border: none; color: #94a3b8; padding: 6px 12px; 
      border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .picker-mode-toggle button.active { background: var(--primary); color: white; }

    .month-grid, .day-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .day-grid { grid-template-columns: repeat(7, 1fr); }
    
    .month-item, .day-item {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); color: #94a3b8; 
      padding: 10px; border-radius: 10px; cursor: pointer; font-size: 0.8rem; text-align: center;
      transition: all 0.2s; font-weight: 600;
    }
    .month-item:hover, .day-item:hover { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.1); }
    .month-item.selected, .day-item.selected { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }

    .options-item, .dropdown-item {
      display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px;
      color: #e2e8f0; font-size: 0.9rem; cursor: pointer; border-radius: 12px; border: none; background: none; text-align: left;
      transition: all 0.2s;
    }
    .options-item:hover, .dropdown-item:hover { background: rgba(255,255,255,0.05); color: white; }
    .options-item .material-symbols-outlined { color: var(--primary); }

    .actions-column { 
      width: 250px; 
      min-width: 250px;
      text-align: left !important;
      padding-left: 10px !important;
    }

    .copy-btn {
      background: none; border: none; color: #94a3b8; cursor: pointer;
      padding: 4px; display: flex; align-items: center; border-radius: 4px;
      transition: all 0.2s; opacity: 0;
    }
    tr:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { color: var(--primary); background: rgba(255,255,255,0.05); }
    .copy-btn:active { transform: scale(0.9); }

    .dropdown-menu {

      position: absolute; right: 0; top: calc(100% + 5px); z-index: 150;
      background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4); min-width: 200px; padding: 6px;
    }
    .dropdown-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 0; }

    .print-guia-container, .print-manifest-container { position: fixed; left: -9999px; top: 0; }
    .manifest-doc { width: 210mm; background: white; color: black; padding: 20mm; }

    .col-filter-input { margin-top: 5px; height: 28px !important; font-size: 0.7rem !important; background: rgba(0,0,0,0.3) !important; }
    .filter-btn { background: none; border: none; color: inherit; cursor: pointer; display: flex; align-items: center; }
    .filter-btn.active { color: var(--primary); }
    .filter-ico { font-size: 14px; }
    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .header-actions-row { flex-direction: column; align-items: stretch; }
      .search-box { width: 100%; }
      .table-tools { justify-content: space-between; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .nx-kpi-card { padding: 1rem !important; }
      .kpi-value { font-size: 1.5rem !important; }
    }
  `]
})
export class EnviosAdminComponent implements OnInit {
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;
  @ViewChild('manifestContainer') manifestContainer!: ElementRef;

  shipments: any[] = [];
  loading = true;
  total = 0;

  // Search & Filters
  searchText: string = '';
  activeStatusFilter: string | null = null;
  columnFilters = { tracking: '', cliente: '' };
  showFilters = { tracking: false, cliente: false };

  // Date Selection
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedDay: number | null = null;
  tempYear: number = this.selectedYear;
  tempMonth: number = this.selectedMonth;
  isMonthMenuOpen = false;
  isDayView = false;
  dateSelectionMode: 'MONTH' | 'DAY' = 'MONTH';

  // UI State
  isOptionsMenuOpen = false;
  isColumnMenuOpen = false;
  openDropdownId: string | null = null;

  // Modal State
  selected: any = null;
  newStatus = '';
  statuses = ['PENDIENTE', 'RECOGIDO', 'EN_TRANSITO', 'EN_DESTINO', 'ENTREGADO', 'CANCELADO'];

  // Printing
  printMode: 'guia' | 'formulario' | null = null;
  printShipment: any = null;
  generatingPdfId: string | null = null;
  currentPieceCount = 1;
  totalPiecesCount = 1;

  columnConfigs = [
    { key: 'guia', label: 'Guía', visible: true },
    { key: 'cliente', label: 'Cliente', visible: true },
    { key: 'remitente', label: 'Remitente', visible: false },
    { key: 'destinatario', label: 'Destinatario', visible: false },
    { key: 'fecha', label: 'Fecha', visible: true },
    { key: 'origen', label: 'Origen', visible: true },
    { key: 'destino', label: 'Destino', visible: true },
    { key: 'peso', label: 'Peso', visible: true },
    { key: 'costo', label: 'Costo', visible: true },
    { key: 'estado', label: 'Estado', visible: true },
    { key: 'acciones', label: 'Acciones', visible: true }
  ];


  monthsShort = [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' }
  ];

  constructor(
    private shipmentService: ShipmentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.loading = true;
    this.shipmentService.getShipments({
      month: this.selectedMonth,
      year: this.selectedYear,
      limit: 200 // Increased limit for admin
    }).subscribe({
      next: (r) => {
        this.shipments = r.data.data;
        this.total = r.data.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get baseFilteredShipments(): any[] {
    if (!this.shipments) return [];
    let result = [...this.shipments];

    // Date Filter (Day level if selected)
    if (this.selectedDay) {
      // Usar local date para comparar con el día seleccionado
      result = result.filter(s => {
        const d = new Date(s.created_at);
        return d.getDate() === this.selectedDay &&
          (d.getMonth() + 1) === this.selectedMonth &&
          d.getFullYear() === this.selectedYear;
      });
    }

    // Global Search
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      result = result.filter(s =>
        s.tracking_number?.toLowerCase().includes(q) ||
        (s.company_name || s.client_name)?.toLowerCase().includes(q) ||
        s.origin_city?.toLowerCase().includes(q) ||
        s.destination_city?.toLowerCase().includes(q) ||
        s.sender_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  get filteredShipments(): any[] {
    let result = this.baseFilteredShipments;

    // Status Filter (KPIs)
    if (this.activeStatusFilter) {
      result = result.filter(s => s.current_status === this.activeStatusFilter);
    }

    // Column Filters
    if (this.columnFilters.tracking) {
      const q = this.columnFilters.tracking.toLowerCase();
      result = result.filter(s => s.tracking_number?.toLowerCase().includes(q));
    }
    if (this.columnFilters.cliente) {
      const q = this.columnFilters.cliente.toLowerCase();
      result = result.filter(s => (s.company_name || s.client_name)?.toLowerCase().includes(q));
    }

    return result;
  }

  // Admin Specific Methods
  viewDetail(s: any) {
    this.selected = s;
    this.newStatus = s.current_status;
    this.openDropdownId = null;
  }

  updateStatus() {
    if (!this.selected) return;
    this.shipmentService.updateStatus(this.selected.id, this.newStatus).subscribe({
      next: () => {
        this.selected = null;
        this.loadShipments();
      }
    });
  }

  // UI Handlers (Ported)
  toggleMonthMenu(e: Event) { e.stopPropagation(); this.isMonthMenuOpen = !this.isMonthMenuOpen; }
  toggleOptionsMenu(e: Event) { e.stopPropagation(); this.isOptionsMenuOpen = !this.isOptionsMenuOpen; }
  toggleDropdown(id: string, e: Event) { e.stopPropagation(); this.openDropdownId = this.openDropdownId === id ? null : id; }

  @HostListener('document:click')
  closeMenus() {
    this.isMonthMenuOpen = false;
    this.isOptionsMenuOpen = false;
    this.openDropdownId = null;
  }

  setPickerMode(mode: 'MONTH' | 'DAY') {
    this.dateSelectionMode = mode;
    this.isDayView = mode === 'DAY';
  }

  changeTempYear(d: number) { this.tempYear += d; }
  changeTempMonth(d: number) {
    this.tempMonth += d;
    if (this.tempMonth > 12) { this.tempMonth = 1; this.tempYear++; }
    else if (this.tempMonth < 1) { this.tempMonth = 12; this.tempYear--; }
  }

  handleMonthClick(m: number) {
    if (this.dateSelectionMode === 'MONTH') {
      this.selectedMonth = m;
      this.selectedYear = this.tempYear;
      this.selectedDay = null;
      this.isMonthMenuOpen = false;
      this.loadShipments();
    } else {
      this.tempMonth = m;
      this.isDayView = true;
    }
  }

  selectDay(d: number) {
    this.selectedDay = d;
    this.selectedMonth = this.tempMonth;
    this.selectedYear = this.tempYear;
    this.isMonthMenuOpen = false;
    this.loadShipments();
  }

  getDaysInMonth(m: number, y: number): number[] {
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  getMonthName(m: number): string {
    const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return names[m - 1];
  }

  getSelectedDateLabel(): string {
    const m = this.getMonthName(this.selectedMonth);
    return this.selectedDay ? `${this.selectedDay} ${m} ${this.selectedYear}` : `${m} ${this.selectedYear}`;
  }

  toggleStatusFilter(s: string) {
    this.activeStatusFilter = this.activeStatusFilter === s ? null : s;
  }

  countByStatus(status: string): number {
    return this.baseFilteredShipments.filter(s => s.current_status === status).length;
  }

  isColumnVisible(k: string) { return this.columnConfigs.find(c => c.key === k)?.visible; }
  toggleColumnFilter(k: 'tracking' | 'cliente') { this.showFilters[k] = !this.showFilters[k]; }

  clearFilters() {
    this.searchText = '';
    this.activeStatusFilter = null;
    this.columnFilters = { tracking: '', cliente: '' };
    this.selectedDay = null;
    this.loadShipments();
  }

  exportToExcel() {
    const data = this.filteredShipments.map(s => ({
      'Guía': s.tracking_number,
      'Cliente': s.company_name || s.client_name,
      'Fecha': new Date(s.created_at).toLocaleDateString(),
      'Origen': s.origin_city,
      'Destino': s.destination_city,
      'Estado': s.current_status,
      'Costo': s.estimated_cost
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Envios');
    XLSX.writeFile(wb, `Nexgo_Admin_Envios_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Printing logic (simplified port)
  imprimirGuia(s: any) {
    this.generatingPdfId = s.id;
    this.printMode = 'guia';
    this.printShipment = s;
    this.totalPiecesCount = s.quantity || 1;
    this.cdr.detectChanges();

    setTimeout(async () => {
      try {
        const tracking = s.tracking_number;
        // JsBarcode("#barcodeCanvas", tracking, { format: "CODE128", width: 2, height: 50, displayValue: false });

        const doc = new jsPDF({ unit: 'mm', format: [100, 100] });
        const element = this.guiaContainer.nativeElement;

        for (let i = 1; i <= this.totalPiecesCount; i++) {
          this.currentPieceCount = i;
          this.cdr.detectChanges();
          await new Promise(r => setTimeout(r, 200));
          const canvas = await html2canvas(element, { scale: 2 });
          if (i > 1) doc.addPage();
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 100, 100);
        }
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
      } finally {
        this.printMode = null;
        this.generatingPdfId = null;
        this.cdr.detectChanges();
      }
    }, 500);
  }

  imprimirFormulario(s: any) {
    this.generatingPdfId = s.id;
    this.printMode = 'formulario';
    this.printShipment = s;
    this.cdr.detectChanges();

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(this.manifestContainer.nativeElement, { scale: 2 });
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        window.open(URL.createObjectURL(doc.output('blob')), '_blank');
      } finally {
        this.printMode = null;
        this.generatingPdfId = null;
      }
    }, 500);
  }

  getTrackingPrefix(s: any) { return s?.tracking_number?.substring(0, 12) || ''; }
  getDeptCode(s: any) { return s?.recipient_department?.substring(0, 3).toUpperCase() || 'GUA'; }
  getStatusLabel(s: string) {
    const l: any = { PENDIENTE: 'Pendiente', RECOGIDO: 'Recogido', EN_TRANSITO: 'En tránsito', EN_DESTINO: 'En destino', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado' };
    return l[s] || s;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback opcional sin diseño
    });
  }
}

