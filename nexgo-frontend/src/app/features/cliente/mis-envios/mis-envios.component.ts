import { Component, OnInit, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment } from '../../../core/models/shipment.model';
import { AuthService } from '../../../core/services/auth.service';
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
              <div class="search-box">
                <span class="material-symbols-outlined search-icon">search</span>
                <input type="text" [(ngModel)]="searchText" placeholder="Buscar por todos los campos de la tabla (Guía, Origen, Destino, Cliente)..." class="nx-input search-input" />
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

                <!-- 2. Menu de Opciones (Nuevo, Exportar, Columnas) -->
                <div class="options-dropdown-container">
                  <button class="nx-btn btn-options" (click)="toggleOptionsMenu($event)" [class.active]="isOptionsMenuOpen">
                    <span class="material-symbols-outlined">settings</span>
                    Acciones
                    <span class="material-symbols-outlined">{{ isOptionsMenuOpen ? 'expand_less' : 'expand_more' }}</span>
                  </button>

                  @if (isOptionsMenuOpen) {
                    <div class="options-menu animate-scale-up" (click)="$event.stopPropagation()">
                      <a routerLink="/cliente/nuevo-envio" class="options-item">
                        <span class="material-symbols-outlined">add_box</span>
                        Nuevo envío
                      </a>
                      <div class="options-divider"></div>
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
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'PENDIENTE'" (click)="toggleStatusFilter('PENDIENTE')" style="position:relative; overflow:hidden;">
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
                <span class="material-symbols-outlined kpi-bg-icon">pending_actions</span>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'RECOGIDO'" (click)="toggleStatusFilter('RECOGIDO')" style="position:relative; overflow:hidden;">
                <div class="kpi-label">Recogidos</div>
                <div class="kpi-value" style="color:#a855f7;">{{ countByStatus('RECOGIDO') }}</div>
                <span class="material-symbols-outlined kpi-bg-icon">package_2</span>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'EN_TRANSITO'" (click)="toggleStatusFilter('EN_TRANSITO')" style="position:relative; overflow:hidden;">
                <div class="kpi-label">En tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
                <span class="material-symbols-outlined kpi-bg-icon">local_shipping</span>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'EN_DESTINO'" (click)="toggleStatusFilter('EN_DESTINO')" style="position:relative; overflow:hidden;">
                <div class="kpi-label">En destino</div>
                <div class="kpi-value" style="color:#f472b6;">{{ countByStatus('EN_DESTINO') }}</div>
                <span class="material-symbols-outlined kpi-bg-icon">distance</span>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'ENTREGADO'" (click)="toggleStatusFilter('ENTREGADO')" style="position:relative; overflow:hidden;">
                <div class="kpi-label">Entregados</div>
                <div class="kpi-value" style="color:var(--status-delivered);">{{ countByStatus('ENTREGADO') }}</div>
                <span class="material-symbols-outlined kpi-bg-icon">check_circle</span>
              </div>
              <div class="nx-kpi-card" [class.active]="activeStatusFilter === 'CANCELADO'" (click)="toggleStatusFilter('CANCELADO')" style="position:relative; overflow:hidden;">
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
                          <button class="filter-btn" [class.active]="showFilters.tracking" (click)="toggleColumnFilter('tracking')">
                            <span class="material-symbols-outlined filter-ico">filter_alt</span>
                          </button>
                        </div>
                        @if (showFilters.tracking) {
                          <input [(ngModel)]="columnFilters.tracking" class="nx-input col-filter-input" placeholder="Filtrar guía..." (click)="$event.stopPropagation()" />
                        }
                      </th>
                    }
                    @if (isColumnVisible('fecha')) { <th style="text-align: center;">Fecha</th> }
                    @if (isColumnVisible('remitente')) { <th style="text-align: center;">Remitente</th> }
                    @if (isColumnVisible('destinatario')) { <th style="text-align: center;">Destinatario</th> }
                    @if (isColumnVisible('origen')) {
                      <th style="text-align: center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
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
                      <th style="text-align: center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
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
                    @if (isColumnVisible('peso')) { <th style="text-align: center;">Peso</th> }
                    @if (isColumnVisible('costo')) { <th style="text-align: center;">Costo est.</th> }
                    @if (isColumnVisible('estado')) {
                      <th style="text-align: center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
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
                    @if (isColumnVisible('acciones')) { <th class="actions-column">ACCIONES</th> }
                  </tr></thead>
                  <tbody>
                    @for (s of filteredShipments; track s.id; let i = $index) {
                      <tr>
                        @if (isColumnVisible('guia')) { 
                          <td>
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                              <span style="color: #e2e8f0; font-family: 'Inter', sans-serif;">{{ s.tracking_number }}</span>
                              <button (click)="copyToClipboard(s.tracking_number)" class="copy-btn" title="Copiar guía">
                                <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>
                              </button>
                            </div>
                          </td> 
                        }
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
                                 <a (click)="imprimirGuia(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id && printMode === 'guia' ? 0.6 : 1">
                                   <span class="material-symbols-outlined">print</span> 
                                   {{ (generatingPdfId === s.id && printMode === 'guia') ? 'Generando...' : 'Imprimir Guía' }}
                                 </a>
                                  <a (click)="imprimirFormulario(s)" class="dropdown-item" [style.opacity]="generatingPdfId === s.id && printMode === 'formulario' ? 0.6 : 1">
                                    <span class="material-symbols-outlined">description</span> 
                                    {{ (generatingPdfId === s.id && printMode === 'formulario') ? 'Generando...' : 'Generar Manifiesto' }}
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
        </div>
      </main>
    </div>

    <!-- ZONA IMPRESIÓN GUÍA -->
    @if (printMode === 'guia' && printShipment) {
      <div class="print-guia-container">
        <div style="display: flex; justify-content: center; align-items: center; background: white; width: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 3px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif; position: relative; padding: 6px;">
            <div style="border: 2px solid black; flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Row 1: REMITENTE -->
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center;">
                <div style="background: black; color: white; font-size: 7px; font-weight: 900; padding: 1px 10px; text-transform: uppercase; letter-spacing: 1px;">Remitente</div>
              </div>
              <div style="display: flex; height: 55px; border-bottom: 2px solid black;">
                <div style="flex:1; padding: 2px 4px; display:flex; flex-direction:column; justify-content:center; font-size: 8px; line-height: 1.1;">
                  <div>Nombre: {{ printShipment.client_name || printShipment.sender_name }}</div>
                  <div>Tel: +502 {{ printShipment.sender_phone }}</div>
                  <div>Correo: {{ printShipment.client_email || auth.currentUser()?.email || 'info@nexgo.com' }}</div>
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
                  <div>Nombre: {{ printShipment.recipient_name }}</div>
                  <div>Tel: +502 {{ printShipment.recipient_phone }}</div>
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

    <!-- ZONA IMPRESIÓN FORMULARIO (MANIFIESTO) -->
    @if (printMode === 'formulario' && printShipment) {
      <div class="print-manifest-container" style="background: white !important;">
        <div #manifestContainer class="manifest-doc">
          <!-- CABECERA -->
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
                <div style="font-size: 9px; font-weight: 800;">No. Guia: <b>{{ printShipment.tracking_number }}</b></div>
             </div>
          </div>

          <table class="m-table">
            <tr>
              <td><span class="m-label">FECHA EXPEDICIÓN</span><span class="m-value">{{ printShipment.created_at | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td><span class="m-label">TIPO MANIFIESTO</span><span class="m-value">ELECTRONICO</span></td>
              <td><span class="m-label">ORIGEN VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ printShipment.origin_city }}</span></td>
              <td><span class="m-label">DESTINO VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ printShipment.destination_city }}</span></td>
            </tr>

            <tr><td colspan="4" class="m-section-header">INFORMACIÓN DEL VEHÍCULO Y CONDUCTOR</td></tr>
            <tr>
              <td colspan="2"><span class="m-label">TITULAR MANIFIESTO</span><span class="m-value">NACIONALES DELIVERY SERVICES</span></td>
              <td colspan="1"><span class="m-label">IDENTIFICACIÓN</span><span class="m-value">NIT 9876543-2</span></td>
              <td colspan="1"><span class="m-label">CIUDAD</span><span class="m-value">GUATEMALA</span></td>
            </tr>
            <tr>
               <td><span class="m-label">PLACA</span><span class="m-value">M-{{ getDeptCode(printShipment) }}</span></td>
               <td><span class="m-label">MARCA</span><span class="m-value">VARIAS</span></td>
               <td><span class="m-label">CONFIGURACION</span><span class="m-value">URBANO / PANEL</span></td>
               <td><span class="m-label">PLAZO VENCIMIENTO SOAT</span><span class="m-value">31/12/2026</span></td>
            </tr>
            <tr>
               <td colspan="2"><span class="m-label">CONDUCTOR</span><span class="m-value">{{ printShipment.driverName || 'REPARTIDOR ASIGNADO' }}</span></td>
               <td><span class="m-label">DOCUMENTO ID</span><span class="m-value">---</span></td>
               <td><span class="m-label">TELÉFONO</span><span class="m-value">{{ printShipment.driverPhone || '---' }}</span></td>
            </tr>

            <tr><td colspan="4" class="m-section-header">INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA</td></tr>
            <tr style="background: #f3f4f6; font-size: 7px; font-weight: 800; text-align: center;">
              <td># REMESA</td>
              <td>CANT.</td>
              <td>DESCRIPCIÓN PRODUCTO / NATURALEZA</td>
              <td>REMITENTE / DESTINATARIO</td>
            </tr>
            <tr style="height: 60px;">
              <td style="text-align: center;"><span class="m-value">{{ getTrackingPrefix(printShipment) }}</span></td>
              <td style="text-align: center;"><span class="m-value">{{ printShipment.quantity }}</span></td>
              <td>
                <span class="m-value" style="display: block; border-bottom: 1px solid #ccc; padding-bottom: 2px;">{{ printShipment.description || 'SIN DESCRIPCION' }}</span>
                <span style="font-size: 8px;"><b>Peso:</b> {{ printShipment.weight_kg }} kg | <b>Fragilidad:</b> {{ printShipment.is_fragile ? 'SI' : 'NO' }}</span>
              </td>
              <td>
                <span class="m-label">REMITENTE:</span> <span class="m-value" style="text-transform:uppercase;">{{ printShipment.sender_name }}</span><br>
                <span class="m-label" style="margin-top:2px;">DESTINATARIO:</span> <span class="m-value" style="text-transform:uppercase;">{{ printShipment.recipient_name }}</span>
              </td>
            </tr>

            <tr><td colspan="4" class="m-section-header">VALORES Y OBSERVACIONES</td></tr>
            <tr>
              <td colspan="2">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">VALOR TOTAL:</span><span class="m-value">Q{{ printShipment.estimated_cost }}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">RETENCION:</span><span class="m-value">Q0.00</span></div>
                <div style="display: flex; justify-content: space-between; padding: 2px 0; font-weight: 900;"><span class="m-label">TOTAL COBRAR:</span><span class="m-value">Q{{ printShipment.total_payment_amount || '0.00' }}</span></div>
              </td>
              <td colspan="2">
                <span class="m-label">OBSERVACIONES:</span>
                <span style="font-size: 8px; font-weight: 600;">{{ printShipment.payment_instructions || 'N/A' }}</span><br>
                <span style="font-size: 8px;">{{ printShipment.comments || '' }}</span>
              </td>
            </tr>
          </table>


          <div style="margin-top: 20px; font-size: 7px; color: #888; text-align: center;">
            Este documento es una representación electrónica del manifiesto de carga Nexgo. Generado el {{ today | date:'dd/MM/yyyy HH:mm' }}.
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
    .search-box { flex: 1; min-width: 400px; display: flex; align-items: center; position: relative; }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
    .search-input { padding-left: 40px !important; width: 100%; height: 45px; background: rgba(0,0,0,0.4) !important; border-color: rgba(255,255,255,0.1) !important; font-size: 0.95rem; border-radius: 12px !important; }
    .search-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2) !important; background: rgba(0,0,0,0.5) !important; }

    /* KPI Interactivity */
    .nx-kpi-card { cursor: pointer; transition: all var(--tr); border: 2px solid transparent; position: relative; overflow: hidden; padding: 1.5rem !important; }
    .nx-kpi-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.03); }
    .nx-kpi-card.active { 
      border-color: var(--primary); 
      background: rgba(99, 102, 241, 0.15); 
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.25), inset 0 0 10px rgba(99, 102, 241, 0.1);
      transform: scale(1.02);
      z-index: 2;
    }

    .kpi-bg-icon {
      position: absolute; right: -15px; bottom: -15px;
      font-size: 5.5rem !important; color: #94a3b8; opacity: 0.12;
      transform: rotate(-10deg); pointer-events: none;
    }
    .nx-kpi-card.active .kpi-bg-icon { opacity: 0.3; color: var(--primary); }

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
    .day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    
    .picker-mode-toggle {
      display: flex; background: rgba(255,255,255,0.05); padding: 3px; border-radius: 8px;
    }
    .picker-mode-toggle button {
      background: none; border: none; color: #94a3b8; padding: 4px 12px; font-size: 0.75rem;
      font-weight: 700; border-radius: 6px; cursor: pointer; transition: all 0.2s;
    }
    .picker-mode-toggle button.active { background: var(--primary); color: white; }

    .month-item, .day-item {
      background: rgba(255,255,255,0.03); border: 1px solid transparent; color: #9ca3af; 
      padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 700;
      text-align: center; transition: all 0.2s; text-transform: uppercase;
      display: flex; align-items: center; justify-content: center;
    }
    .day-item { padding: 8px 0; font-size: 0.8rem; aspect-ratio: 1; min-width: 32px; }
    
    .month-item:hover, .day-item:hover { background: rgba(99, 102, 241, 0.15); color: var(--primary); border-color: rgba(99, 102, 241, 0.3); }
    .month-item.selected, .day-item.selected { background: var(--primary); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

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
    .table-tools { display: flex; align-items: center; gap: 12px; }
    
    .options-dropdown-container { position: relative; }
    .btn-options { 
      background: #5d1d88ff !important; border: 1px solid rgba(255,255,255,0.2) !important; 
      color: white !important; font-weight: 800; font-size: 0.85rem; padding: 0 20px; height: 45px;
      display: flex; align-items: center; gap: 10px; border-radius: 12px !important; 
      box-shadow: 0 4px 15px rgba(93, 29, 136, 0.3); transition: all 0.3s;
      cursor: pointer;
    }
    .btn-options:hover { 
      background: #5d1d88ff !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
    .btn-options.active { 
      background: #5d1d88ff !important;
      transform: scale(0.98);
    }
    
    .options-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 130;
      background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 8px; min-width: 240px;
      backdrop-filter: blur(20px); transform-origin: top right;
    }
    .options-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px;
      color: white; font-size: 0.9rem; font-weight: 600; cursor: pointer; border-radius: 8px;
      transition: all 0.2s; text-decoration: none; border: none; background: none; text-align: left;
    }
    .options-item:hover { 
      background: #6366F1 !important; 
      color: white !important; 
    }
    .options-item .material-symbols-outlined { font-size: 20px; color: white; }
    .options-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 0; }

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
    .print-guia-container, .print-manifest-container { 
      display: block; 
      position: fixed; 
      left: -9999px; /* Fuera de la pantalla pero visible para el renderizador */
      top: 0;
    }

    /* MANIFESTO STYLES (Fuera de media print para que html2canvas los capture) */
    .manifest-doc {
      width: 210mm;
      min-height: 297mm;
      background: white;
      color: black !important;
      font-family: 'Arial Narrow', Arial, sans-serif;
      padding: 10mm;
      box-sizing: border-box;
      border: 1px solid #eee;
      margin: 0 auto;
    }
    .nx-table th { 
      font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; 
      text-align: center !important; padding: 12px; 
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .nx-table th > div { justify-content: center !important; }
    .nx-table td { color: #e2e8f0; font-size: 0.9rem; text-align: left; padding: 12px; }
    
    .copy-btn {
      background: none; border: none; color: #94a3b8; cursor: pointer;
      padding: 4px; display: flex; align-items: center; border-radius: 4px;
      transition: all 0.2s; opacity: 0;
    }
    tr:hover .copy-btn { opacity: 1; }
    .copy-btn:hover { color: var(--primary); background: rgba(255,255,255,0.05); }
    .copy-btn:active { transform: scale(0.9); }
    
    .nx-table-wrap { position: relative; overflow-x: auto; }
    .nx-table-wrap::after {
      content: ''; position: absolute; top: 0; bottom: 0; right: 250px;
      width: 1px; background: rgba(255, 255, 255, 0.1); pointer-events: none; z-index: 10;
    }
    
    .actions-column { 
      width: 250px; 
      min-width: 250px;
      text-align: left !important;
      padding-left: 10px !important;
    }
    .m-table { width: 100%; border-collapse: collapse; border: 2px solid black !important; color: black !important; }
    .m-table td { border: 1px solid black !important; padding: 4px; vertical-align: top; font-size: 9px; line-height: 1.1; color: black !important; }
    .m-header-cell { background: #f3f4f6 !important; font-weight: 800; text-transform: uppercase; font-size: 8px; border-bottom: 2px solid black !important; }
    .m-title { font-size: 14px; font-weight: 900; text-align: center; margin-bottom: 4px; color: black !important; }
    .m-subtitle { font-size: 10px; font-weight: 700; text-align: center; color: #444 !important; }
    .m-label { font-weight: 800; font-size: 8px; color: #333 !important; margin-bottom: 2px; display: block; text-transform: uppercase; }
    .m-value { font-weight: 600; font-size: 10px; color: black !important; }
    .m-section-header { background: #e5e7eb !important; font-weight: 800; text-align: center; font-size: 9px; border-top: 2px solid black !important; border-bottom: 2px solid black !important; color: black !important; }
    .m-sig-box { height: 60px; border-top: 1px solid black !important; margin-top: 20px; text-align: center; font-size: 8px; font-weight: 700; color: black !important; padding-top: 40px; }
    
    @media print {
      :host ::ng-deep app-sidebar,
      .nx-layout { display: none !important; }
      @page { margin: 0; }
      body { margin: 0; padding: 0; background: white !important; }

      .print-guia-container, .print-manifest-container {
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
  @ViewChild('manifestContainer') manifestContainer!: ElementRef;

  shipments: any[] = [];
  total = 0;
  loading = true;

  printMode: 'guia' | 'formulario' | null = null;
  printShipment: any = null;
  generatingPdfId: string | null = null;
  currentPieceCount: number = 1;
  totalPiecesCount: number = 1;
  today = new Date();
  openDropdownId: string | null = null;

  searchText: string = '';
  activeStatusFilter: string | null = null;

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  selectedDay: number | null = null;
  tempYear: number = this.selectedYear;
  tempMonth: number = this.selectedMonth;
  isMonthMenuOpen: boolean = false;
  isDayView: boolean = false;
  dateSelectionMode: 'MONTH' | 'DAY' = 'MONTH';

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
  isOptionsMenuOpen = false;

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

    // Date Filter (Day level if selected)
    if (this.selectedDay) {
      result = result.filter(s => {
        const d = new Date(s.created_at);
        return d.getDate() === this.selectedDay;
      });
    }

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

  constructor(
    private shipmentService: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public auth: AuthService
  ) { }

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
    if (this.isMonthMenuOpen) {
      this.isOptionsMenuOpen = false;
      this.isColumnMenuOpen = false;
      // No reset isDayView to keep "memory"
      this.tempYear = this.selectedYear;
      this.tempMonth = this.selectedMonth;
    }
  }

  setPickerMode(mode: 'MONTH' | 'DAY') {
    this.dateSelectionMode = mode;
    this.isDayView = (mode === 'DAY'); // If Day mode, show days immediately
    this.tempMonth = this.selectedMonth;
    this.tempYear = this.selectedYear;
  }

  changeTempMonth(delta: number) {
    let nextMonth = this.tempMonth + delta;
    if (nextMonth > 12) {
      nextMonth = 1;
      this.tempYear++;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      this.tempYear--;
    }
    this.tempMonth = nextMonth;
  }

  handleMonthClick(monthValue: number) {
    if (this.dateSelectionMode === 'MONTH') {
      this.selectMonth(monthValue);
    } else {
      this.goToDayView(monthValue);
    }
  }

  changeTempYear(delta: number) {
    this.tempYear += delta;
  }

  goToDayView(monthValue: number) {
    this.tempMonth = monthValue;
    this.isDayView = true;
  }

  selectFullMonth() {
    this.selectedMonth = this.tempMonth;
    this.selectedYear = this.tempYear;
    this.selectedDay = null;
    this.isMonthMenuOpen = false;
    this.loadShipments();
  }

  selectDay(day: number) {
    this.selectedDay = day;
    this.selectedMonth = this.tempMonth;
    this.selectedYear = this.tempYear;
    this.isMonthMenuOpen = false;
    this.loadShipments();
  }

  getDaysInMonth(month: number, year: number): number[] {
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  }

  getMonthName(month: number): string {
    return this.months.find(m => m.value === month)?.label || '';
  }

  selectMonth(monthValue: number) {
    this.selectedMonth = monthValue;
    this.selectedYear = this.tempYear;
    this.selectedDay = null;
    this.isMonthMenuOpen = false;
    this.loadShipments();
  }

  getSelectedDateLabel(): string {
    const m = this.months.find(m => m.value === this.selectedMonth);
    if (this.selectedDay) {
      return `${this.selectedDay} ${m?.label || ''} ${this.selectedYear}`;
    }
    return `${m?.label || ''} ${this.selectedYear}`;
  }

  clearFilters() {
    this.searchText = '';
    this.activeStatusFilter = null;
    this.columnFilters = { tracking: '', origen: '', destino: '', status: '' };
    this.loadShipments(); // Recargar con mes actual si se desea, o mantener el mes? El usuario pidió limpiar
  }

  countByStatus(status: string): number {
    let list = [...this.shipments];

    // Filter by Selected Day if present
    if (this.selectedDay) {
      list = list.filter(s => {
        const d = new Date(s.created_at);
        return d.getDate() === this.selectedDay;
      });
    }

    // Filter by Search Text if present
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      list = list.filter(s =>
        (s.tracking_number?.toLowerCase().includes(q)) ||
        (s.origin_city?.toLowerCase().includes(q)) ||
        (s.destination_city?.toLowerCase().includes(q)) ||
        (s.sender_name?.toLowerCase().includes(q)) ||
        (s.recipient_name?.toLowerCase().includes(q))
      );
    }

    return list.filter((s: any) => s.current_status === status).length;
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

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
    if (this.isOptionsMenuOpen) {
      this.isMonthMenuOpen = false;
    }
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
      this.isOptionsMenuOpen = false;
    }
  }

  imprimirGuia(s: any) {
    if (this.generatingPdfId === s.id) return;
    this.generatingPdfId = s.id;
    this.printMode = 'guia';
    this.printShipment = s;
    this.totalPiecesCount = s.quantity || 1;
    this.cdr.detectChanges();

    console.log(`--- Generando ${this.totalPiecesCount} guías para ${s.tracking_number} ---`);

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [100, 100]
    });

    const generateAllPages = async () => {
      try {
        const tracking = s.tracking_number || s.trackingNumber || 'ND0000000';

        // Esperar renderizado inicial del contenedor
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generar el código de barras una vez (asegurando que el elemento esté en el DOM)
        /*
        try {
          JsBarcode("#barcodeCanvas", tracking, {
            format: "CODE128", width: 2.2, height: 55, displayValue: false, margin: 0,
            background: "#ffffff", lineColor: "#000000"
          });
        } catch (bErr) {
          console.error('Error generando código de barras:', bErr);
        }
        */

        for (let i = 1; i <= this.totalPiecesCount; i++) {
          this.currentPieceCount = i;
          this.cdr.detectChanges();

          // Esperar renderizado del número de pieza
          await new Promise(resolve => setTimeout(resolve, 300));

          const element = this.guiaContainer.nativeElement;
          const canvas = await html2canvas(element, {
            scale: 3.5,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              const el = clonedDoc.querySelector('.print-guia-container') as HTMLElement;
              if (el) {
                el.style.left = '0'; el.style.top = '0'; el.style.position = 'relative';
                el.style.display = 'block'; el.style.visibility = 'visible';
              }
            }
          });

          const imgData = canvas.toDataURL('image/png');
          if (i > 1) doc.addPage([100, 100], 'p');
          doc.addImage(imgData, 'PNG', 0, 0, 100, 100);
          console.log(`Bulto ${i} de ${this.totalPiecesCount} procesado`);
        }

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const win = window.open(pdfUrl, '_blank');
        if (!win) {
          doc.save(`Guia_${tracking}.pdf`);
          alert('La pestaña emergente fue bloqueada, se ha descargado el PDF automáticamente.');
        }
      } catch (err) {
        console.error('Error generando PDF:', err);
        alert('Ocurrió un error al generar la guía. Por favor intenta de nuevo.');
      } finally {
        this.printMode = null;
        this.generatingPdfId = null;
        this.cdr.detectChanges();
      }
    };

    generateAllPages();
  }

  imprimirFormulario(shipment: any) {
    if (this.generatingPdfId) return;
    this.generatingPdfId = shipment.id;
    this.printShipment = shipment;
    this.printMode = 'formulario';

    console.log('--- Generando Manifiesto A4 ---');
    this.cdr.detectChanges(); // Forzar renderizado de Angular

    // Esperar a que Angular renderice el contenedor del manifiesto
    setTimeout(async () => {
      try {
        console.log('Capturando contenedor:', this.manifestContainer.nativeElement);
        const element = this.manifestContainer.nativeElement;

        const canvas = await html2canvas(element, {
          scale: 3,
          logging: true,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.print-manifest-container') as HTMLElement;
            if (el) {
              el.style.left = '0';
              el.style.top = '0';
              el.style.position = 'relative';
              el.style.display = 'block';
              el.style.visibility = 'visible';
              console.log('Clon del manifiesto preparado para captura');
            }
          }
        });

        console.log('Captura completada, generando PDF...');

        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.autoPrint();
        const pdfUrl = URL.createObjectURL(doc.output('blob'));
        window.open(pdfUrl, '_blank');

      } catch (err) {
        console.error('Error generating Manifest:', err);
      } finally {
        this.printMode = null;
        this.printShipment = null;
        this.generatingPdfId = null;
      }
    }, 1000);
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

  getStatusLabel(status: string): string {
    const labels: any = {
      PENDIENTE: 'Pendiente',
      RECOGIDO: 'Recogido',
      EN_TRANSITO: 'En tránsito',
      EN_DESTINO: 'En destino',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado'
    };
    return labels[status] || status;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback opcional sin diseño
    });
  }
}
