import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { CreateShipmentRequest } from '../../../core/models/shipment.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import { GUATEMALA_DATA } from '../../../core/constants/guatemala-data';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nuevo-envio',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="nx-layout print-hide">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit; margin-right:8px;">local_post_office</span> 
            Registrar Nuevo Envío
          </span>
        </div>
        <div class="nx-content">
          
          <!-- STEPPER PROGRESS BAR -->
          <div class="stepper-wrapper">
            <div class="stepper-line">
              <div class="stepper-progress" [style.width.%]="(currentStep - 1) * 33.33"></div>
            </div>
            <div class="stepper-steps">
              @for (step of steps; track step.id) {
                <div class="step-item" [class.active]="currentStep === step.id" [class.completed]="currentStep > step.id" (click)="goToStep(step.id)">
                  <div class="step-circle">
                    @if (currentStep > step.id) {
                      <span class="material-symbols-outlined">check</span>
                    } @else {
                      <span class="material-symbols-outlined">{{ step.icon }}</span>
                    }
                  </div>
                  <span class="step-label">{{ step.title }}</span>
                </div>
              }
            </div>
          </div>

          <div class="workflow-container">
            @if (success) {
              <div class="nx-card success-card" style="text-align:center; padding: 4rem 2rem; background: linear-gradient(145deg, #131936 0%, #0d122b 100%); border: 1px solid rgba(99, 102, 241, 0.2);">
                <div class="success-icon-wrapper">
                  <div class="success-ring"></div>
                  <span class="material-symbols-outlined success-icon-main">verified</span>
                </div>
                
                <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem; background: linear-gradient(90deg, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">¡Envío registrado!</h2>
                <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2.5rem;">
                  Tu número de guía ha sido generado con éxito
                </p>

                <div class="tracking-badge" (click)="copyToClipboard()" style="cursor: pointer; position: relative;">
                  <span class="label">GUÍA NO.</span>
                  <div style="display:flex; align-items:center; gap: 12px; justify-content: center;">
                    <span class="value">{{ trackingNumber }}</span>
                    <span class="material-symbols-outlined" style="font-size: 1.5rem; color: var(--primary);">content_copy</span>
                  </div>
                  @if (copied) {
                    <div class="copied-badge">¡Copiado!</div>
                  }
                </div>
                
                <div class="success-actions-grid">
                  <button class="action-btn primary" (click)="imprimirGuia()" [disabled]="generatingPdf">
                    <span class="material-symbols-outlined icon">receipt_long</span>
                    <div class="btn-content">
                      <span class="btn-title">{{ generatingPdf && printMode === 'guia' ? 'Generando...' : 'Imprimir GUÍA' }}</span>
                      <span class="btn-sub">Formato 10x10cm</span>
                    </div>
                  </button>
                  
                  <button class="action-btn secondary" (click)="imprimirFormulario()" [disabled]="generatingPdf">
                    <span class="material-symbols-outlined icon">description</span>
                    <div class="btn-content">
                      <span class="btn-title">{{ generatingPdf && printMode === 'formulario' ? 'Generando...' : 'Imprimir Formulario' }}</span>
                      <span class="btn-sub">Detalle completo</span>
                    </div>
                  </button>

                  <button class="action-btn accent" (click)="resetForm()">
                    <span class="material-symbols-outlined icon">add_box</span>
                    <div class="btn-content">
                      <span class="btn-title">Nuevo Envío</span>
                      <span class="btn-sub">Crear otra guía</span>
                    </div>
                  </button>

                  <button class="action-btn ghost" (click)="goToEnvios()">
                    <span class="material-symbols-outlined icon">list_alt</span>
                    <div class="btn-content">
                      <span class="btn-title">Mis Envíos</span>
                      <span class="btn-sub">Ver historial</span>
                    </div>
                  </button>
                </div>
              </div>
            }

            @if (!success) {
              <div class="step-content-wrapper">
                
                <!-- STEP 1: REMITENTE -->
                @if (currentStep === 1) {
                  <div class="nx-card step-card animate-fade-in">
                    <div class="card-header">
                      <h3><span class="material-symbols-outlined">person</span> 1. Información del Remitente</h3>
                      <span class="step-indicator">Paso 1 de 4</span>
                    </div>
                    <div class="card-body">
                      @if (isGestor) {
                        <div class="nx-form-group" style="background: rgba(99, 102, 241, 0.1); padding: 1rem; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2); margin-bottom: 1.5rem;">
                          <label style="color: var(--primary); font-weight: 800;">SELECCIONAR CLIENTE (MODO GESTOR)</label>
                          <select class="nx-input" [(ngModel)]="selectedClientId" (change)="onClientSelect(selectedClientId)">
                            <option value="">-- Seleccionar Cliente --</option>
                            @for (u of allUsers; track u.id) {
                              <option [value]="u.id">{{ u.companyName || u.name }} ({{ u.username }})</option>
                            }
                          </select>
                        </div>
                      }

                      <div class="nx-form-group">
                        <label>Nombre del Remitente *</label>
                        <input class="nx-input" [class.error]="attemptedNext && !form.senderName" [(ngModel)]="form.senderName" placeholder="Nombre completo o Empresa" [readonly]="!isGestor" [style.opacity]="!isGestor ? '0.7' : '1'" [style.cursor]="!isGestor ? 'not-allowed' : 'text'" [style.background]="!isGestor ? 'rgba(255,255,255,0.05)' : 'transparent'" />
                      </div>
                      <div class="nx-form-row cols-2">
                        <div class="nx-form-group">
                          <label>Teléfono *</label>
                          <input class="nx-input" [class.error]="attemptedNext && !form.senderPhone" [(ngModel)]="form.senderPhone" placeholder="502XXXXXXXX" [readonly]="!isGestor" [style.opacity]="!isGestor ? '0.7' : '1'" [style.cursor]="!isGestor ? 'not-allowed' : 'text'" [style.background]="!isGestor ? 'rgba(255,255,255,0.05)' : 'transparent'" />
                        </div>
                        <div class="nx-form-group">
                          <label>Ciudad de Origen</label>
                          <input class="nx-input" [(ngModel)]="form.originCity" placeholder="Ej: Guatemala" />
                        </div>
                      </div>
                      <div class="nx-form-group">
                        <label>Dirección de Recolección *</label>
                          <input class="nx-input" [class.error]="attemptedNext && !form.senderAddress" [(ngModel)]="form.senderAddress" placeholder="Calle, Av, Edificio, Oficina..." />
                      </div>
                    </div>
                    <div class="card-footer-actions">
                      <div></div>
                      <button class="nx-btn btn-primary btn-lg" (click)="nextStep()">
                        Siguiente: Destino <span class="material-symbols-outlined" style="margin-left:8px;">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }

                <!-- STEP 2: DESTINATARIO -->
                @if (currentStep === 2) {
                  <div class="nx-card step-card animate-fade-in">
                    <div class="card-header">
                      <h3><span class="material-symbols-outlined">location_on</span> 2. Destino del Paquete</h3>
                      <span class="step-indicator">Paso 2 de 4</span>
                    </div>
                    <div class="card-body">
                      <div class="nx-form-group">
                        <label>Nombre del Destinatario *</label>
                        <input class="nx-input" [class.error]="attemptedNext && !form.recipientName" [(ngModel)]="form.recipientName" placeholder="¿Quién recibe el paquete?" />
                      </div>
                      <div class="nx-form-group">
                        <label>Teléfono de contacto *</label>
                        <input class="nx-input" [class.error]="attemptedNext && !form.recipientPhone" [(ngModel)]="form.recipientPhone" placeholder="502XXXXXXXX" />
                      </div>
                      <div class="nx-form-row cols-2">
                        <div class="nx-form-group">
                          <label>Departamento *</label>
                          <select class="nx-input" [class.error]="attemptedNext && !form.recipientDepartment" [(ngModel)]="form.recipientDepartment" (change)="onDepartmentChange()">
                            <option value="">Seleccione Departamento</option>
                            @for (dept of departments; track dept) {
                              <option [value]="dept">{{ dept }}</option>
                            }
                          </select>
                        </div>
                        <div class="nx-form-group">
                          <label>Municipio / Ciudad *</label>
                          <select class="nx-input" [class.error]="attemptedNext && !form.recipientMunicipality" [(ngModel)]="form.recipientMunicipality" [disabled]="!form.recipientDepartment">
                            <option value="">Seleccione Municipio</option>
                            @for (muni of filteredMunicipalities; track muni) {
                              <option [value]="muni">{{ muni }}</option>
                            }
                          </select>
                        </div>
                      </div>
                      <div class="nx-form-row cols-2">
                        <div class="nx-form-group">
                          <label>Zona (Opcional)</label>
                          <input class="nx-input" [(ngModel)]="form.recipientZone" placeholder="Ej: Zona 1" />
                        </div>
                        <div class="nx-form-group">
                          <label>Referencia / Comentarios (Opcional)</label>
                          <input class="nx-input" [(ngModel)]="form.comments" placeholder="A la par de..." />
                        </div>
                      </div>
                      <div class="nx-form-group">
                        <label>Dirección exacta de entrega *</label>
                        <input class="nx-input" [class.error]="attemptedNext && !form.recipientAddress" [(ngModel)]="form.recipientAddress" placeholder="Avenida, Calle, Casa numeral..." />
                      </div>
                    </div>
                    <div class="card-footer-actions">
                      <button class="nx-btn btn-ghost btn-lg" (click)="prevStep()">
                        <span class="material-symbols-outlined" style="margin-right:8px;">arrow_back</span> Anterior
                      </button>
                      <button class="nx-btn btn-primary btn-lg" (click)="nextStep()">
                        Siguiente: Paquete <span class="material-symbols-outlined" style="margin-left:8px;">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }

                <!-- STEP 3: PAQUETE -->
                @if (currentStep === 3) {
                  <div class="nx-card step-card animate-fade-in">
                    <div class="card-header">
                      <h3><span class="material-symbols-outlined">inventory_2</span> 3. Información del Paquete</h3>
                      <span class="step-indicator">Paso 3 de 4</span>
                    </div>
                    <div class="card-body">
                      <div class="nx-form-row cols-3">
                        <div class="nx-form-group">
                          <label>Peso (libras) *</label>
                          <input class="nx-input" type="number" [(ngModel)]="form.weightKg" />
                        </div>
                        <div class="nx-form-group">
                          <label>Cant. Piezas</label>
                          <input class="nx-input" type="number" [(ngModel)]="form.quantity" />
                        </div>
                        <div class="nx-form-group" style="padding-top: 1.8rem;">
                          <label style="display:flex; align-items:center; gap: 8px; cursor:pointer;">
                            <input type="checkbox" [(ngModel)]="form.isFragile" /> Frágil
                          </label>
                        </div>
                      </div>
                      <hr class="nx-divider">
                      <div class="nx-form-row cols-2">
                        <div class="nx-form-group">
                          <label>No. Orden (Automático)</label>
                          <input class="nx-input" [(ngModel)]="form.orderNumber" placeholder="Se generará automáticamente" readonly style="opacity: 0.6; cursor: not-allowed;" />
                        </div>
                        <div class="nx-form-group">
                          <label>No. Ticket (Automático)</label>
                          <input class="nx-input" [(ngModel)]="form.ticketNumber" placeholder="Se generará automáticamente" readonly style="opacity: 0.6; cursor: not-allowed;" />
                        </div>
                      </div>
                      <div class="nx-form-row cols-2">
                        <div class="nx-form-group">
                          <label>Código Destino</label>
                          <select class="nx-input" [(ngModel)]="form.destinationCode">
                            @for (code of destCodes; track code) {
                              <option [value]="code">{{ code }}</option>
                            }
                          </select>
                        </div>
                        <div class="nx-form-group">
                          <label>Servicio</label>
                          <select class="nx-input" [(ngModel)]="form.serviceTag">
                            @for (tag of serviceTags; track tag) {
                              <option [value]="tag">{{ tag }}</option>
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                    <div class="card-footer-actions">
                      <button class="nx-btn btn-ghost btn-lg" (click)="prevStep()">
                        <span class="material-symbols-outlined" style="margin-right:8px;">arrow_back</span> Anterior
                      </button>
                      <button class="nx-btn btn-primary btn-lg" (click)="nextStep()">
                        Siguiente: Cobro <span class="material-symbols-outlined" style="margin-left:8px;">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }

                <!-- STEP 4: COBRO -->
                @if (currentStep === 4) {
                  <div class="nx-card step-card animate-fade-in">
                    <div class="card-header">
                      <h3><span class="material-symbols-outlined">payments</span> 4. Instrucciones de Cobro</h3>
                      <span class="step-indicator">Paso 4 de 4</span>
                    </div>
                    <div class="card-body">
                      <!-- Resumen de Tarifa Nexgo -->
                      @if (userRule) {
                        <div class="nx-card" style="background: rgba(99, 102, 241, 0.05); border: 1px dashed rgba(99, 102, 241, 0.3); margin-bottom: 2rem; padding: 1.25rem;">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">RESUMEN DE COBRO NEXGO:</span>
                            <span style="font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 800; background: var(--primary); color: white;">
                              {{ userRule.user_id ? 'TARIFA PERSONALIZADA' : 'TARIFA NIVEL' }}
                            </span>
                          </div>
                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size: 0.9rem; color: #fff;">
                              Costo de Envío:
                            </div>
                            <div style="font-size: 1.75rem; font-weight: 900; color: var(--primary);">
                              Q{{ currentEstimatedNexgoCost | number:'1.2-2' }}
                            </div>
                          </div>
                          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div style="font-size: 0.7rem; color: var(--text-muted);">
                              <b>Tarifa Base:</b> Q{{ userRule.base_price }} ({{ userRule.base_weight }}LB incl.)
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">
                              <b>Libra Extra:</b> Q{{ userRule.extra_weight_price }} / LB
                            </div>
                            <div style="font-size: 0.7rem; color: #a5b4fc; font-weight: 700;">
                              <b>Piezas:</b> {{ form.quantity }} x {{ form.weightKg }} LB
                            </div>
                            <div style="font-size: 0.7rem; color: #a5b4fc; font-weight: 700; text-align: right;">
                              <b>Total Peso:</b> {{ (form.quantity || 1) * (form.weightKg || 0) }} LB
                            </div>
                          </div>
                          <!-- DISPONIBILIDAD DE GUÍAS -->
                          <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid {{ (userRule.available_guides || 0) < (form.quantity || 1) ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)' }}">
                             <div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">INVENTARIO DE GUÍAS:</div>
                                <div style="font-size: 1.1rem; font-weight: 800; color: {{ (userRule.available_guides || 0) < (form.quantity || 1) ? '#f43f5e' : '#10b981' }}">
                                   {{ userRule.available_guides || 0 }} disponibles
                                </div>
                             </div>
                             <div style="text-align: right;">
                                <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">REQUERIDAS:</div>
                                <div style="font-size: 1.1rem; font-weight: 800; color: white;">{{ form.quantity || 1 }}</div>
                             </div>
                          </div>
                          @if ((userRule.available_guides || 0) < (form.quantity || 1)) {
                             <div style="margin-top: 8px; font-size: 0.75rem; color: #f43f5e; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 14px;">error</span>
                                No tienes guías suficientes para esta cantidad de piezas.
                             </div>
                          }
                        </div>
                      }

                      @if (isGestor) {
                        <div class="nx-card" style="margin-bottom: 2rem; padding: 1.25rem; border: 1px solid var(--accent-2);">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                            <span style="font-weight: 700; color: var(--accent-2);">MODO MANUAL (GESTOR)</span>
                            <label class="nx-switch">
                              <input type="checkbox" [(ngModel)]="isManualPrice">
                              <span class="slider round"></span>
                            </label>
                          </div>
                          
                          @if (isManualPrice) {
                            <div class="nx-form-group animate-fade-in">
                              <label>Monto Personalizado a Cobrar (Q)</label>
                              <div class="input-with-icon">
                                <span class="currency-prefix">Q</span>
                                <input class="nx-input" type="number" [(ngModel)]="manualPriceValue" placeholder="0.00" style="padding-left: 2.5rem; border-color: var(--accent-2);" />
                              </div>
                              <small style="color: var(--text-muted);">Este monto ignorará la tarifa calculada y será el cobro final.</small>
                            </div>
                          }
                        </div>
                      }

                      <!-- El monto a cobrar ahora es automático basado en la tarifa -->
                      <div class="nx-form-group">
                        <label>Instrucciones de Pago y Comentarios</label>
                        <textarea class="nx-input" [(ngModel)]="form.paymentInstructions" rows="4" placeholder="Ej: Favor cobrar con envío incluido, dejar en recepción..."></textarea>
                      </div>
                      
                      @if (error) { 
                        <div class="nx-alert alert-error">
                          <span class="material-symbols-outlined">warning</span> {{ error }}
                        </div> 
                      }
                    </div>
                    <div class="card-footer-actions">
                      <button class="nx-btn btn-ghost btn-lg" (click)="prevStep()">
                        <span class="material-symbols-outlined" style="margin-right:8px;">arrow_back</span> Anterior
                      </button>
                      <button class="nx-btn btn-accent btn-lg" (click)="submit()" [disabled]="saving">
                        @if (saving) { 
                          <span class="spinner"></span> Registrando... 
                        } @else { 
                          <span class="material-symbols-outlined" style="margin-right:8px;">rocket_launch</span> REGISTRAR ENVÍO 
                        }
                      </button>
                    </div>
                  </div>
                }

              </div>
            }
          </div>
        </div>
      </main>
    </div>

    <!-- ZONA IMPRESIÓN GUÍA (Hidden) -->
    @if (printMode === 'guia') {
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
                  <div>Nombre: {{ form.senderName }}</div>
                  <div>Tel: {{ form.senderPhone }}</div>
                  <div>Correo: {{ auth.currentUser()?.email || 'info@nexgo.com' }}</div>
                  <div>Empresa: {{ $any(form).companyName || auth.currentUser()?.companyName || 'Nexgo Customer' }}</div>
                </div>
                <div style="width: 170px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px;">
                  <div style="text-align:center; margin-bottom: 2px;">
                    <div style="font-size:12px; font-weight:900; line-height:1; color: black; font-family: 'Arial Black', sans-serif;">Nacionales</div>
                    <div style="font-size:5px; font-weight:bold; color: #333; letter-spacing: 0.5px;">Delivery Services</div>
                  </div>
                  <div style="display:flex; gap:12px; width: 90%; justify-content: center;">
                    <div style="text-align:center;"><div style="font-size:12px; font-weight:900; color: black; line-height:1;">{{ form.orderNumber || '0' }}</div><div style="font-size:5px; font-weight:bold; color: black;">No. Orden</div></div>
                    <div style="text-align:center;"><div style="font-size:12px; font-weight:900; color: black; line-height:1;">{{ form.ticketNumber || '0' }}</div><div style="font-size:5px; font-weight:bold; color: black;">No. Ticket</div></div>
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
                  <div style="margin-bottom: 1px;">Nombre: {{ form.recipientName }}</div>
                  <div>Tel: {{ form.recipientPhone }}</div>
                  <div>Dir: {{ form.recipientAddress }}, {{ form.recipientMunicipality }}, {{ form.recipientDepartment }}</div>
                  <div style="font-size: 8.5px; margin-top:2px; color: black; border-top: 1px dashed black; padding-top: 2px;">
                    Indicaciones: {{ form.paymentInstructions || 'Favor Cobrar Q' + (form.totalPaymentAmount || '0.00') + ' con envío incluido' }}
                  </div>
                </div>
                <div style="width: 80px; display: flex; align-items: center; justify-content: center; background: white;">
                  <div style="border: 2px solid black; font-size: 20px; font-weight: 900; padding: 6px 4px; color: black; line-height: 1;">{{ form.serviceTag || 'DOM' }}</div>
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
                  {{ trackingNumber }}
                </div>
              </div>
              <!-- Col 2: Pieza Boxed -->
              <div style="width: 140px; display: flex; align-items: center; justify-content: center; padding: 6px;">
                <div style="border: 2.5px solid black; width: 100%; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: white;">
                  <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1; margin-bottom: 3px;">Piezas</div>
                  <div style="font-size: 20px; font-weight: 900; color: black; display: flex; gap: 8px; align-items: center;">
                    <span>01</span>
                    <span style="font-size: 10px;">DE</span>
                    <span>{{ form.quantity | number:'2.0' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 4: DESTINATION & WEIGHT & PAYMENT -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="flex:1.4; display:flex; align-items:center; padding: 4px; gap: 8px;">
                <div style="border: 2.5px solid black; font-size: 36px; font-weight: 900; padding: 2px 8px; line-height: 0.9; color: black; font-family: 'Arial Black', sans-serif; min-width: 70px; text-align: center;">{{ form.destinationCode || 'GUA' }}</div>
                <div style="font-size: 9px; font-weight: 900; line-height: 1.1; color: black; text-transform: uppercase;">GT:<br>Paquete<br>Pequeño</div>
              </div>
              <div style="flex:1; border-left:2px solid black; display: flex; flex-direction: column;">
                <!-- Peso -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-bottom: 2px solid black; background: white;">
                  <div style="font-size: 7px; font-weight: 900; color: black; text-transform: uppercase; line-height: 1;">PESO lb</div>
                  <div style="font-size: 20px; font-weight: 900; color: black; line-height: 1;">{{ form.weightKg }}</div>
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
                <div style="font-size: 11px; font-weight: 900; line-height: 1; font-family: 'Arial Black', sans-serif;">{{ getDeptCode() }}</div>
                <div style="font-size: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 11px; font-weight: 900; line-height: 1; text-transform: uppercase; font-family: 'Arial Black', sans-serif; letter-spacing: 0.5px;">{{ form.recipientMunicipality || 'Guatemala' }}</div>
                <div style="font-size: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 12px; font-weight: 900; line-height: 1; font-family: 'Arial Black', sans-serif;">{{ form.recipientZone || '0' }}</div>
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
    @if (printMode === 'formulario') {
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
                <div style="font-size: 9px; font-weight: 800;">No. Guia: <b>{{ trackingNumber }}</b></div>
             </div>
          </div>

          <table class="m-table">
            <tr>
              <td><span class="m-label">FECHA EXPEDICIÓN</span><span class="m-value">{{ today | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td><span class="m-label">TIPO MANIFIESTO</span><span class="m-value">ELECTRONICO</span></td>
              <td><span class="m-label">ORIGEN VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ form.originCity }}</span></td>
              <td><span class="m-label">DESTINO VIAJE</span><span class="m-value" style="text-transform:uppercase;">{{ form.destinationCity }}</span></td>
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
               <td colspan="2"><span class="m-label">CONDUCTOR</span><span class="m-value">REPARTIDOR ASIGNADO</span></td>
               <td><span class="m-label">DOCUMENTO ID</span><span class="m-value">---</span></td>
               <td><span class="m-label">TELÉFONO</span><span class="m-value">---</span></td>
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
              <td style="text-align: center;"><span class="m-value">1</span></td>
              <td>
                <span class="m-value" style="display: block; border-bottom: 1px solid #ccc; padding-bottom: 2px;">{{ form.description || 'PAQUETE LOGISTICO' }}</span>
                <span style="font-size: 8px;"><b>Peso:</b> {{ form.weightKg }} kg | <b>Fragilidad:</b> {{ form.isFragile ? 'SI' : 'NO' }}</span>
              </td>
              <td>
                <span class="m-label">REMITENTE:</span> <span class="m-value" style="text-transform:uppercase;">{{ form.senderName }}</span><br>
                <span class="m-label" style="margin-top:2px;">DESTINATARIO:</span> <span class="m-value" style="text-transform:uppercase;">{{ form.recipientName }}</span>
              </td>
            </tr>

            <tr><td colspan="4" class="m-section-header">VALORES Y OBSERVACIONES</td></tr>
            <tr>
              <td colspan="2">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">VALOR TOTAL:</span><span class="m-value">Q{{ estimatedCost }}</span></div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0;"><span class="m-label">RETENCION:</span><span class="m-value">Q0.00</span></div>
                <div style="display: flex; justify-content: space-between; padding: 2px 0; font-weight: 900;"><span class="m-label">TOTAL COBRAR:</span><span class="m-value">Q{{ form.totalPaymentAmount || '0.00' }}</span></div>
              </td>
              <td colspan="2">
                <span class="m-label">OBSERVACIONES:</span>
                <span style="font-size: 8px; font-weight: 600;">{{ form.paymentInstructions || 'N/A' }}</span><br>
                <span style="font-size: 8px;">{{ form.comments || '' }}</span>
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
    .nx-input.error {
      border-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.05) !important;
      box-shadow: 0 0 4px rgba(239, 68, 68, 0.4) !important;
    }
    .nx-main { padding-top: var(--navbar-height); min-height: 100vh; }
    .nx-content { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }

    /* STEPPER UI */
    .stepper-wrapper {
      position: relative;
      margin-bottom: 3rem;
      padding: 0 1rem;
    }
    .stepper-line {
      position: absolute;
      top: 25px;
      left: 10%;
      right: 10%;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
    .stepper-progress {
      height: 100%;
      background: var(--primary);
      box-shadow: 0 0 10px var(--glow-primary);
      transition: width var(--tr);
    }
    .stepper-steps {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      width: 80px;
    }
    .step-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #1e293b;
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all var(--tr);
      font-size: 1.25rem;
    }
    .step-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-align: center;
      transition: color var(--tr);
    }
    .step-item.active .step-circle {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      box-shadow: 0 0 20px var(--glow-primary);
      transform: scale(1.1);
    }
    .step-item.active .step-label { color: white; }
    .step-item.completed .step-circle {
      background: var(--status-delivered);
      border-color: var(--status-delivered);
      color: white;
    }

    /* CARD STYLES */
    .step-card {
      background: var(--bg-card);
      border: 1px solid rgba(99, 102, 241, 0.15);
      animation: slideUp 0.4s ease-out;
    }
    .card-header {
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .card-header h3 { margin: 0; display: flex; align-items: center; gap: 12px; color: white; font-size: 1.2rem; }
    .card-header h3 .material-symbols-outlined { color: var(--primary); }
    .step-indicator { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    
    .card-body { padding: 2rem; }
    .card-footer-actions {
      padding: 1.5rem 2rem;
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    /* SUCCESS SCREEN */
    .success-icon-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .success-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid var(--status-delivered);
      animation: pulse 2s infinite;
    }
    .success-icon-main { font-size: 5rem !important; color: var(--status-delivered); z-index: 2; }
    
    .tracking-badge {
      display: inline-flex;
      flex-direction: column;
      background: rgba(99,102,241,0.1);
      padding: 1rem 2rem;
      border-radius: var(--radius);
      border: 1px solid rgba(99,102,241,0.2);
      margin-bottom: 3rem;
    }
    .tracking-badge .label { font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 0.1em; }
    .tracking-badge .value { font-size: 1.8rem; font-weight: 800; color: white; }

    .success-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      border-radius: var(--radius);
      border: 1px solid rgba(255,255,255,0.05);
      background: rgba(255,255,255,0.03);
      cursor: pointer;
      transition: all var(--tr);
      text-align: left;
    }
    .action-btn .icon { font-size: 2.2rem !important; opacity: 0.8; }
    .action-btn .btn-title { display: block; font-weight: 700; font-size: 1rem; color: white; }
    .action-btn .btn-sub { font-size: 0.75rem; color: var(--text-muted); }
    .action-btn:hover { transform: translateY(-3px); background: rgba(255,255,255,0.08); border-color: rgba(99,102,241,0.3); }
    
    .action-btn.primary, .action-btn.secondary, .action-btn.accent, .action-btn.ghost { 
      background: #059668bb; border: none;
    }
    
    .action-btn.primary .icon, .action-btn.secondary .icon, 
    .action-btn.accent .icon, .action-btn.ghost .icon { color: white !important; }
    
    .action-btn .btn-title { color: white !important; }
    .action-btn .btn-sub { color: rgba(255,255,255,0.8) !important; }
    
    .action-btn:hover { 
      transform: translateY(-5px); 
      filter: brightness(1.1);
      box-shadow: 0 10px 20px -5px rgba(0,0,0,0.5);
    }

    /* UTILS */
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }

    .nx-divider { border: none; height: 1px; background: rgba(255,255,255,0.05); margin: 1.5rem 0; }
    .input-with-icon { position: relative; display: flex; align-items: center; }
    .currency-prefix { position: absolute; left: 1rem; font-weight: 700; color: var(--primary); }

    /* Print styles */
    .print-guia-container, .print-manifest-container { 
      display: block; 
      position: fixed; 
      left: -9999px;
      top: 0;
      z-index: -1;
    }
    
    @media print {
      .print-hide { display: none !important; }
      body { margin: 0; padding: 0; background: white !important; }

      .print-guia-container, .print-manifest-container {
        display: block !important;
        position: absolute;
        top: 0; left: 0; width: 100%; height: auto;
        background: white !important; color: black !important;
        z-index: 9999;
      }
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
    .m-table { width: 100%; border-collapse: collapse; border: 2px solid black !important; color: black !important; }
    .m-table td { border: 1px solid black !important; padding: 4px; vertical-align: top; font-size: 9px; line-height: 1.1; color: black !important; }
    .m-title { font-size: 14px; font-weight: 900; text-align: center; margin-bottom: 4px; color: black !important; }
    .m-subtitle { font-size: 10px; font-weight: 700; text-align: center; color: #444 !important; }
    .m-label { font-weight: 800; font-size: 8px; color: #333 !important; margin-bottom: 2px; display: block; text-transform: uppercase; }
    .m-value { font-weight: 600; font-size: 10px; color: black !important; }
    .m-section-header { background: #e5e7eb !important; font-weight: 800; text-align: center; font-size: 9px; border-top: 2px solid black !important; border-bottom: 2px solid black !important; color: black !important; }
    .m-sig-box { height: 60px; border-top: 1px solid black !important; margin-top: 20px; text-align: center; font-size: 8px; font-weight: 700; color: black !important; padding-top: 40px; flex: 1; }

    /* GESTOR SWITCH */
    .nx-switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 24px;
    }
    .nx-switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #334155;
      transition: .4s;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
    }
    input:checked + .slider { background-color: var(--accent-2); }
    input:focus + .slider { box-shadow: 0 0 1px var(--accent-2); }
    input:checked + .slider:before { transform: translateX(22px); }
    .slider.round { border-radius: 24px; }
    .slider.round:before { border-radius: 50%; }

    .copied-badge {
      position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
      background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px;
      font-size: 0.7rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      animation: bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  `]
})
export class NuevoEnvioComponent {
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;
  @ViewChild('manifestContainer') manifestContainer!: ElementRef;

  saving = false;
  success = false;
  error = '';
  trackingNumber = '';
  estimatedCost = 0;
  currentStep = 1;
  copied = false;
  generatingPdf = false;
  isGestor = false;
  allUsers: any[] = [];
  selectedClientId: string = '';

  steps = [
    { id: 1, title: 'Remitente', icon: 'person', component: 'sender' },
    { id: 2, title: 'Destino', icon: 'location_on', component: 'recipient' },
    { id: 3, title: 'Paquete', icon: 'inventory_2', component: 'package' },
    { id: 4, title: 'Cobro', icon: 'payments', component: 'payment' }
  ];

  printMode: 'guia' | 'formulario' | null = null;
  today = new Date();


  destCodes = ['GUA', 'QTZ', 'HUE', 'XELA', 'PET', 'ESC', 'SAC'];
  serviceTags = ['DOM', 'EXP', 'COL', 'COD'];

  form: CreateShipmentRequest = {
    senderName: '', senderPhone: '', senderAddress: '', originCity: 'Guatemala',
    recipientName: '', recipientPhone: '', recipientAddress: '', destinationCity: '',
    recipientDepartment: '', recipientMunicipality: '', recipientZone: '',
    weightKg: 1, quantity: 1, isFragile: false,
    orderNumber: '', ticketNumber: '', destinationCode: 'GUA', serviceTag: 'DOM',
    totalPaymentAmount: 0, paymentInstructions: '', comments: ''
  };

  currentPieceCount: number = 1;
  totalPiecesCount: number = 1;
  attemptedNext: boolean = false;

  departments = Object.keys(GUATEMALA_DATA);
  filteredMunicipalities: string[] = [];

  constructor(
    private shipmentService: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public auth: AuthService,
    private admin: AdminService
  ) { }

  userRule: any = null;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.isGestor = user.role === 'GESTOR_ADMINISTRATIVO' || user.role === 'ADMIN';
      this.form.senderName = user.companyName || user.name;
      this.form.senderPhone = user.phone || '';
      this.form.originCity = 'Guatemala';

      if (this.isGestor) {
        this.loadAllUsers();
      }

      this.loadPricingRules(user);
    }
  }

  loadAllUsers() {
    this.admin.getUsers({}).subscribe((res: any) => {
      this.allUsers = res.data.data;
    });
  }

  loadPricingRules(user: any) {
    this.admin.getPricingRules().subscribe((res: any) => {
      if (res.success) {
        const rules = res.data as any[];
        let rule = rules.find(r => r.user_id === user.id && r.is_active);
        if (!rule) {
          rule = rules.find(r => r.role_id == user.role_id && !r.user_id && r.is_active);
        }
        this.userRule = rule;
      }
    });
  }

  onClientSelect(userId: string) {
    const selectedUser = this.allUsers.find(u => u.id === userId);
    if (selectedUser) {
      this.form.senderName = selectedUser.companyName || selectedUser.name;
      this.form.senderPhone = selectedUser.phone || '';
      this.loadPricingRules(selectedUser);
    }
  }

  isManualPrice = false;
  manualPriceValue = 0;

  get currentEstimatedNexgoCost(): number {
    if (!this.userRule) return 0;
    const base = Number(this.userRule.base_price) || 0;
    const extra = Number(this.userRule.extra_weight_price) || 0;
    const weightPerPiece = Number(this.form.weightKg) || 0;
    const quantity = Number(this.form.quantity) || 1;
    const baseWeight = Number(this.userRule.base_weight) || 1;

    let costPerPiece = base;
    if (weightPerPiece > baseWeight) {
      costPerPiece += (weightPerPiece - baseWeight) * extra;
    }

    return costPerPiece * quantity;
  }

  onDepartmentChange() {
    const dept = this.form.recipientDepartment;
    if (dept && GUATEMALA_DATA[dept]) {
      this.filteredMunicipalities = GUATEMALA_DATA[dept];
      // Si el municipio actual no está en la nueva lista, limpiarlo
      if (!this.filteredMunicipalities.includes(this.form.recipientMunicipality || '')) {
        this.form.recipientMunicipality = '';
      }
    } else {
      this.filteredMunicipalities = [];
      this.form.recipientMunicipality = '';
    }
  }


  nextStep() {
    if (this.currentStep < 4) {
      if (this.currentStep === 1 && (!this.form.senderName || !this.form.senderPhone || !this.form.senderAddress)) {
        this.attemptedNext = true;
        Swal.fire({
          icon: 'warning',
          title: 'Datos del Remitente',
          text: 'Por favor complete todos los campos obligatorios del remitente.',
          background: '#1e293b',
          color: '#ffffff',
          confirmButtonColor: '#6366f1'
        });
        return;
      }
      if (this.currentStep === 2 && (!this.form.recipientName || !this.form.recipientPhone || !this.form.recipientDepartment || !this.form.recipientMunicipality || !this.form.recipientAddress)) {
        this.attemptedNext = true;
        Swal.fire({
          icon: 'warning',
          title: 'Datos del Destinatario',
          text: 'Complete los campos obligatorios del destinatario (Nombre, Teléfono, Depto, Municipio y Dirección)',
          background: '#1e293b',
          color: '#ffffff',
          confirmButtonColor: '#6366f1'
        });
        return;
      }

      this.attemptedNext = false;
      this.currentStep++;
      this.error = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(stepId: number) {
    if (stepId < this.currentStep) {
      this.currentStep = stepId;
    }
  }

  submit() {
    this.form.destinationCity = this.form.recipientMunicipality || '';

    // Asignar automáticamente el monto calculado como el monto a cobrar
    // Si el gestor activó modo manual, usamos su valor
    this.form.totalPaymentAmount = this.isManualPrice ? this.manualPriceValue : this.currentEstimatedNexgoCost;

    // Asignar regla de tarifa si existe
    if (this.userRule) {
      this.form.pricingRuleId = this.userRule.id;
    }

    // Si es gestor y seleccionó un cliente, lo mandamos
    if (this.isGestor && this.selectedClientId) {
      this.form.clientId = this.selectedClientId;
    }

    // Validar disponibilidad de guías
    const totalPieces = this.form.quantity || 1;
    const available = this.userRule?.available_guides || 0;

    if (totalPieces > available) {
      Swal.fire({
        icon: 'error',
        title: 'Guías Insuficientes',
        text: `No tienes suficientes guías para este envío (${totalPieces} piezas). Tu balance actual es de ${available} guías.`,
        background: '#1e293b',
        color: '#ffffff',
        confirmButtonColor: '#f43f5e'
      });
      return;
    }

    this.saving = true;
    this.error = '';

    this.shipmentService.createShipment(this.form).subscribe({
      next: (r) => {
        console.log('Registro exitoso:', r);
        this.saving = false;
        this.success = true;
        this.trackingNumber = (r.data as any).tracking_number || r.data.trackingNumber;
        this.estimatedCost = (r.data as any).estimated_cost || 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (e) => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar envío',
          text: e?.error?.message || 'No se pudo conectar con el servidor. Intente de nuevo.',
          background: '#1e293b',
          color: '#ffffff',
          confirmButtonColor: '#f43f5e'
        });
      },
    });
  }

  resetForm() {
    this.success = false;
    this.trackingNumber = '';
    this.currentStep = 1;
    this.printMode = null;
    this.form = {
      senderName: '', senderPhone: '', senderAddress: '', originCity: 'Guatemala',
      recipientName: '', recipientPhone: '', recipientAddress: '', destinationCity: '',
      recipientDepartment: '', recipientMunicipality: '', recipientZone: '',
      weightKg: 1, quantity: 1, isFragile: false,
      orderNumber: '', ticketNumber: '', destinationCode: 'GUA', serviceTag: 'DOM',
      totalPaymentAmount: 0, paymentInstructions: '', comments: ''
    };
  }

  goToEnvios() { this.router.navigate(['/cliente/mis-envios']); }

  copyToClipboard() {
    if (!this.trackingNumber) return;
    navigator.clipboard.writeText(this.trackingNumber).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }


  imprimirGuia() {
    if (this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'guia';
    this.totalPiecesCount = this.form.quantity || 1;
    this.cdr.detectChanges();

    console.log(`--- Generando ${this.totalPiecesCount} guías ---`);

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [100, 100]
    });

    const generateAllPages = async () => {
      try {
        const tracking = this.trackingNumber || 'ND0000000';

        /*
        // Generar el código de barras una vez
        setTimeout(() => {
          JsBarcode("#barcodeCanvasSuccess", tracking, {
            format: "CODE128", width: 2.2, height: 55, displayValue: false, margin: 0,
            background: "#ffffff", lineColor: "#000000"
          });
        }, 100);
        */

        for (let i = 1; i <= this.totalPiecesCount; i++) {
          this.currentPieceCount = i;
          this.cdr.detectChanges();

          // Esperar renderizado del número de pieza
          await new Promise(resolve => setTimeout(resolve, 250));

          const element = this.guiaContainer.nativeElement;
          const canvas = await html2canvas(element, {
            scale: 4,
            useCORS: true,
            backgroundColor: '#ffffff',
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
          console.log(`Bulto ${i} procesado`);
        }

        const pdfUrl = URL.createObjectURL(doc.output('blob'));
        window.open(pdfUrl, '_blank');
      } catch (err) {
        console.error('Error generando PDF:', err);
      } finally {
        this.printMode = null;
        this.generatingPdf = false;
        this.cdr.detectChanges();
      }
    };

    generateAllPages();
  }

  imprimirFormulario() {
    if (this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'formulario';

    console.log('--- Generando Manifiesto Success ---');
    this.cdr.detectChanges();

    setTimeout(async () => {
      try {
        console.log('Capturando:', this.manifestContainer.nativeElement);
        const element = this.manifestContainer.nativeElement;
        const canvas = await html2canvas(element, {
          scale: 3, logging: true, useCORS: true, backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('.print-manifest-container') as HTMLElement;
            if (el) {
              el.style.left = '0'; el.style.top = '0'; el.style.position = 'relative';
              el.style.display = 'block'; el.style.visibility = 'visible';
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
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
        this.generatingPdf = false;
      }
    }, 1000);
  }

  getTrackingPrefix(): string {
    return (this.trackingNumber || '').toString().substring(0, 12);
  }

  getDeptCode(): string {
    return (this.form.recipientDepartment || 'GUA').toString().substring(0, 3).toUpperCase();
  }
}
