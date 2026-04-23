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
                      <div class="picker-header" style="flex-direction: column; gap: 12px; border-bottom: none; margin-bottom: 8px;">
                        <div style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
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
                <div class="options-dropdown-container">
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
        <div style="display: flex; justify-content: center; align-items: flex-start; background: white; width: 100mm; height: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 2px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif;">
            <!-- Row 1: REMITENTE -->
            <div style="display:flex; border-bottom: 2px solid black; height: 65px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Remitente</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ printShipment.sender_name }}</div>
                <div style="font-size: 15px; font-weight: 700; color: black;">Tel. {{ printShipment.sender_phone }}</div>
              </div>
              <div style="width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #ccc; padding: 2px;">
                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="width:24px; height:24px; background:black; color:white; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size: 14px;">📦</div>
                  <div style="text-align:left;">
                    <div style="font-size:12px; font-weight:900; line-height:1; color: black;">Nacionales</div>
                    <div style="font-size:7px; font-weight:bold; color: #444;">Delivery Services</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Row 2: DESTINATARIO -->
            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ printShipment.recipient_name }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ printShipment.recipient_phone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dir: {{ printShipment.recipient_address }}, {{ printShipment.destination_city }}</div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">DOM</div>
              </div>
            </div>
            <!-- Row 3: MIDDLE SECTION (BARCODE) -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black;">Guía No.<br>{{ getTrackingPrefix(printShipment) }}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 5px;">
                <svg id="barcodeCanvas"></svg>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 10px; font-weight: bold;">PIEZA<br><span style="font-size: 28px; line-height: 1;">{{ currentPieceCount }}</span>DE<br><span style="font-size: 24px; line-height: 0.8;">{{ totalPiecesCount }}</span></div>
              </div>
            </div>
            <!-- Footer GT -->
            <div style="display:flex; height: 35px; background: black; color: white;">
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ getDeptCode(printShipment) }}</div>
                <div style="font-size: 7px; font-weight: bold;">Departamento</div>
              </div>
              <div style="flex:3; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ printShipment.destination_city }}</div>
                <div style="font-size: 7px; font-weight: bold;">Municipio</div>
              </div>
            </div>
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
    .btn-date-picker, .btn-options { 
      background: #5d1d88ff !important; border: 1px solid rgba(255,255,255,0.2) !important; 
      color: white !important; font-weight: 700; height: 45px; padding: 0 16px; border-radius: 12px !important;
      display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
    }
    .btn-date-picker:hover, .btn-options:hover { filter: brightness(1.1); transform: translateY(-2px); }

    .month-picker-dropdown, .options-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 130;
      background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 12px; min-width: 240px;
      backdrop-filter: blur(20px); transform-origin: top right;
    }
    .month-picker-dropdown { left: 0; transform-origin: top left; }

    .month-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .month-item, .day-item {
      background: rgba(255,255,255,0.03); border: 1px solid transparent; color: #9ca3af; 
      padding: 8px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; text-align: center;
    }
    .month-item.selected, .day-item.selected { background: var(--primary); color: white; }

    .options-item, .dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px;
      color: white; font-size: 0.85rem; cursor: pointer; border-radius: 8px; border: none; background: none; text-align: left;
    }
    .options-item:hover, .dropdown-item:hover { background: var(--primary); }

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
  ) {}

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

  get filteredShipments(): any[] {
    if (!this.shipments) return [];
    let result = [...this.shipments];

    // Status Filter (KPIs)
    if (this.activeStatusFilter) {
      result = result.filter(s => s.current_status === this.activeStatusFilter);
    }

    // Date Filter (Day level if selected)
    if (this.selectedDay) {
      result = result.filter(s => new Date(s.created_at).getDate() === this.selectedDay);
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
    return this.shipments.filter(s => s.current_status === status).length;
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
        JsBarcode("#barcodeCanvas", tracking, { format: "CODE128", width: 2, height: 50, displayValue: false });
        
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

