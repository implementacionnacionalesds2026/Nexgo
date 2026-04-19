import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { CreateShipmentRequest } from '../../../core/models/shipment.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';

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
            <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_post_office</span> 
            Registrar Nuevo Envío
          </span>
        </div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Nueva Guía de Envío</h1>
            <p>Completa el formulario para registrar tu envío</p>
          </div>

          <div class="workflow-container">
            @if (success) {
              <div class="nx-card success-card" style="text-align:center; padding: 3rem 1rem;">
                <div class="success-icon" style="font-size: 5rem; color: var(--success); margin-bottom: 2rem;">
                  <span class="material-symbols-outlined" style="font-size:inherit;">check_circle</span>
                </div>
                <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">¡Envío registrado!</h2>
                <p style="font-size: 1.25rem; color: #666; margin-bottom: 2.5rem;">
                  Tu número de guía es: <strong style="color:var(--primary); font-size: 1.5rem;">{{ trackingNumber }}</strong>
                </p>
                
                <div style="display:flex; flex-direction:column; gap:1.5rem; max-width: 400px; margin: 0 auto;">
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="nx-btn btn-secondary" (click)="imprimirGuia()" [disabled]="generatingPdf" style="padding: 1rem; background:black; color:white;">
                      <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">print</span> 
                      {{ generatingPdf ? '...' : 'Imprimir GUÍA' }}
                    </button>
                    <button class="nx-btn btn-secondary" (click)="imprimirFormulario()" style="padding: 1rem; background:#444; color:white;">
                      <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">description</span> Formulario
                    </button>
                  </div>
                  <hr style="border:none; border-top:1px solid #eee; margin: 1rem 0;">
                  <button class="nx-btn btn-primary" (click)="resetForm()" style="padding: 1.25rem;">
                    <span class="material-symbols-outlined" style="vertical-align:middle; font-size:inherit;">add</span> Crear otro envío
                  </button>
                  <button class="nx-btn btn-ghost" (click)="goToEnvios()">Ver mis envíos →</button>
                </div>
              </div>
            }

            @if (!success) {
              <div class="form-grid">
                
                <!-- TARJETA 1: REMITENTE -->
                <div class="nx-card">
                  <div class="card-header">
                    <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">person</span> 1. Información del Remitente</h3>
                  </div>
                  <div class="card-body">
                    <div class="nx-form-group">
                      <label>Nombre del Remitente *</label>
                      <input class="nx-input" [(ngModel)]="form.senderName" placeholder="Nombre completo o Empresa" />
                    </div>
                    <div class="nx-form-row cols-2">
                      <div class="nx-form-group">
                        <label>Teléfono *</label>
                        <input class="nx-input" [(ngModel)]="form.senderPhone" placeholder="502XXXXXXXX" />
                      </div>
                      <div class="nx-form-group">
                        <label>Ciudad de Origen</label>
                        <input class="nx-input" [(ngModel)]="form.originCity" placeholder="Ej: Guatemala" />
                      </div>
                    </div>
                    <div class="nx-form-group">
                      <label>Dirección de Recolección *</label>
                      <input class="nx-input" [(ngModel)]="form.senderAddress" placeholder="Calle, Av, Edificio, Oficina..." />
                    </div>
                  </div>
                </div>

                <!-- TARJETA 2: DESTINATARIO -->
                <div class="nx-card">
                  <div class="card-header">
                    <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> 2. Destino del Paquete</h3>
                  </div>
                  <div class="card-body">
                    <div class="nx-form-group">
                      <label>Nombre del Destinatario *</label>
                      <input class="nx-input" [(ngModel)]="form.recipientName" placeholder="¿Quién recibe el paquete?" />
                    </div>
                    <div class="nx-form-group">
                      <label>Teléfono de contacto *</label>
                      <input class="nx-input" [(ngModel)]="form.recipientPhone" placeholder="502XXXXXXXX" />
                    </div>
                    <div class="nx-form-row cols-2">
                      <div class="nx-form-group">
                        <label>Departamento *</label>
                        <select class="nx-input" [(ngModel)]="form.recipientDepartment">
                          <option value="">Seleccione Departamento</option>
                          @for (dept of deparments; track dept) {
                            <option [value]="dept">{{ dept }}</option>
                          }
                        </select>
                      </div>
                      <div class="nx-form-group">
                        <label>Municipio / Ciudad *</label>
                        <input class="nx-input" [(ngModel)]="form.recipientMunicipality" placeholder="Ej: Mixco, Xela..." />
                      </div>
                    </div>
                    <div class="nx-form-row cols-2">
                      <div class="nx-form-group">
                        <label>Zona</label>
                        <input class="nx-input" [(ngModel)]="form.recipientZone" placeholder="Ej: Zona 1" />
                      </div>
                      <div class="nx-form-group">
                        <label>Referencia / Comentarios</label>
                        <input class="nx-input" [(ngModel)]="form.comments" placeholder="A la par de..." />
                      </div>
                    </div>
                    <div class="nx-form-group">
                      <label>Dirección exacta de entrega *</label>
                      <input class="nx-input" [(ngModel)]="form.recipientAddress" placeholder="Avenida, Calle, Casa numeral..." />
                    </div>
                  </div>
                </div>

                <!-- TARJETA 3: PAQUETE Y GUÍA -->
                <div class="nx-card">
                  <div class="card-header">
                    <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> 3. Información del Paquete</h3>
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
                    <hr style="background:#eee;border:none;height:1px;margin:1rem 0;">
                    <div class="nx-form-row cols-2">
                      <div class="nx-form-group">
                        <label>No. Orden (Manual)</label>
                        <input class="nx-input" [(ngModel)]="form.orderNumber" placeholder="Ej: 4567" />
                      </div>
                      <div class="nx-form-group">
                        <label>No. Ticket (Manual)</label>
                        <input class="nx-input" [(ngModel)]="form.ticketNumber" placeholder="Ej: 1234" />
                      </div>
                    </div>
                    <div class="nx-form-row cols-2">
                      <div class="nx-form-group">
                        <label>Código Destino (GUA/QTZ...)</label>
                        <select class="nx-input" [(ngModel)]="form.destinationCode">
                          @for (code of destCodes; track code) {
                            <option [value]="code">{{ code }}</option>
                          }
                        </select>
                      </div>
                      <div class="nx-form-group">
                        <label>Servicio (DOM/EXP...)</label>
                        <select class="nx-input" [(ngModel)]="form.serviceTag">
                          @for (tag of serviceTags; track tag) {
                            <option [value]="tag">{{ tag }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TARJETA 4: COBRO Y PAGO -->
                <div class="nx-card">
                  <div class="card-header">
                    <h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">payments</span> 4. Instrucciones de Cobro</h3>
                  </div>
                  <div class="card-body">
                    <div class="nx-form-group">
                      <label>Monto a Cobrar al Destinatario (Q)</label>
                      <input class="nx-input" type="number" [(ngModel)]="form.totalPaymentAmount" placeholder="Ej: 150.00" />
                      <small style="color:#666;">Ingrese 0 si el envío ya está pagado.</small>
                    </div>
                    <div class="nx-form-group">
                      <label>Instrucciones de Pago</label>
                      <textarea class="nx-input" [(ngModel)]="form.paymentInstructions" rows="3" placeholder="Ej: Favor cobrar con envío incluido..."></textarea>
                    </div>
                    
                    @if (error) { 
                      <div class="nx-alert alert-error" style="margin-top:1.5rem;">
                        <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}
                      </div> 
                    }

                    <div style="margin-top: 2rem;">
                      <button class="nx-btn btn-accent" (click)="submit()" [disabled]="saving" style="width:100%; padding: 1.25rem; font-size: 1.1rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                        @if (saving) { <span class="spinner" style="width:20px;height:20px;border-width:2px;margin-right:8px;"></span> Registrando... }
                        @else { <span class="material-symbols-outlined" style="vertical-align:middle; font-size:1.4rem; margin-right:8px;">rocket_launch</span> REGISTRAR ENVÍO }
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            }
          </div>
        </div>
      </main>
    </div>

    <!-- ZONA IMPRESIÓN GUÍA -->
    @if (printMode === 'guia') {
      <div class="print-container">
        <div style="display: flex; justify-content: center; align-items: flex-start; background: white; width: 100mm; height: 100mm;">
          <div #guiaContainer style="width: 385px; height: 375px; background: white; border: 2px solid black; box-sizing: border-box; display: flex; flex-direction: column; color: black; font-family: Arial, sans-serif;">
            
            <!-- Row 1: REMITENTE -->
            <div style="display:flex; border-bottom: 2px solid black; height: 65px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Remitente</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ form.senderName }}</div>
                <div style="font-size: 15px; font-weight: 700; color: black;">Tel. {{ form.senderPhone }}</div>
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
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ form.orderNumber || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Orden</div></div>
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">{{ form.ticketNumber || '0' }}</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Ticket</div></div>
                </div>
              </div>
            </div>

            <!-- Row 2: DESTINATARIO -->
            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ form.recipientName }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ form.recipientPhone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dir: {{ form.recipientAddress }}, {{ form.recipientMunicipality }}, {{ form.recipientDepartment }} {{ form.recipientZone }}</div>
                <div style="font-size: 11px; font-weight: 700; margin-top:2px; color: black;">
                  {{ form.paymentInstructions || 'Favor Cobrar Q' + (form.totalPaymentAmount || '0.00') + ' con envío incluido' }}
                </div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">{{ form.serviceTag || 'DOM' }}</div>
              </div>
            </div>

            <!-- Row 3: MIDDLE SECTION (BARCODE) -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black; font-family: monospace;">Guía No.<br>{{ getTrackingPrefix() }}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center; padding: 5px;">
                <svg id="barcodeCanvasSuccess"></svg>
              </div>
              <div style="width: 75px; border-left: 2px solid black; display: flex; flex-direction: column;">
                <div style="flex:1; border-bottom: 2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                  PIEZA<br><span style="font-size: 28px; line-height: 1;">01</span>DE<br><span style="font-size: 24px; line-height: 0.8;">{{ form.quantity | number:'2.0' }}</span>
                </div>
              </div>
            </div>

            <!-- Row 4: GUA SECTION -->
            <div style="display:flex; border-bottom: 2px solid black; height: 110px; align-items:stretch;">
              <div style="flex:1; display:flex; align-items:center; padding: 5px; gap: 10px;">
                <div style="border: 3px solid black; font-size: 64px; font-weight: 900; padding: 4px 10px; line-height: 1; color: black;">{{ form.destinationCode || 'GUA' }}</div>
                <div style="font-size: 14px; font-weight: 800; line-height: 1.1; color: black;">GT-004:<br>paquete<br>pequeño</div>
              </div>
              <div style="width: 140px; display:flex; flex-direction:column;">
                <div style="flex:1; display:flex; flex-direction:column; border-left:2px solid black;">
                  <div style="flex:1; border-bottom:2px solid black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: black;">
                    PESO lb<br><span style="font-size: 28px; line-height: 1;">{{ form.weightKg }}</span>DE<br><span style="font-size: 24px; line-height: 0.8;">999</span>
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
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ getDeptCode() }}</div>
                <div style="font-size: 7px; font-weight: bold;">Departamento</div>
              </div>
              <div style="flex:3; border-right: 1px solid white; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 18px; font-weight: 900; line-height: 1;">{{ form.recipientMunicipality || 'Xela' }}</div>
                <div style="font-size: 7px; font-weight: bold;">Municipio</div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div style="font-size: 20px; font-weight: 900; line-height: 1;">{{ form.recipientZone || '3' }}</div>
                <div style="font-size: 7px; font-weight: bold;">Zona</div>
              </div>
            </div>
            <div style="font-size: 6px; text-align: center; color: black;">** Guía sujeta a términos y condiciones **</div>
          </div>
        </div>
      </div>
    }

    <!-- ZONA IMPRESIÓN FORMULARIO -->
    @if (printMode === 'formulario') {
      <div class="print-container">
        <div style="padding: 2cm; font-family: 'Helvetica', Arial, sans-serif; max-width: 800px; margin: 0 auto; color: black;">
          <div style="text-align:center; margin-bottom: 2rem; border-bottom: 2px solid #070b24; padding-bottom: 1rem;">
            <h1 style="margin:0; font-size: 28px; color: #070b24;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Nacionales Delivery Services</h1>
            <p style="margin:5px 0 0 0; color: #444; font-size: 16px;">Formulario Detallado de Envío</p>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom: 2rem;">
            <div>
              <b style="color:#070b24;">Número de Guía:</b> {{ trackingNumber }}<br>
              <b style="color:#070b24;">Fecha:</b> {{ today | date:'dd/MM/yyyy' }}
            </div>
            <div style="text-align:right;">
              <b style="color:#070b24;">Estado:</b> Registrado<br>
              <b style="color:#070b24;">Servicio:</b> Envío Nacional Prio
            </div>
          </div>

          <div style="display:flex; gap: 2rem; margin-bottom: 2rem;">
            <div style="flex:1; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> Datos del Remitente</h3>
              <p style="margin: 5px 0;"><b>Nombre:</b> {{ form.senderName }}</p>
              <p style="margin: 5px 0;"><b>Teléfono:</b> {{ form.senderPhone }}</p>
              <p style="margin: 5px 0;"><b>Dirección:</b> {{ form.senderAddress }}</p>
              <p style="margin: 5px 0;"><b>Ciudad:</b> {{ form.originCity }}</p>
            </div>
            <div style="flex:1; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
              <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;">📫 Datos del Destinatario</h3>
              <p style="margin: 5px 0;"><b>Nombre:</b> {{ form.recipientName }}</p>
              <p style="margin: 5px 0;"><b>Teléfono:</b> {{ form.recipientPhone }}</p>
              <p style="margin: 5px 0;"><b>Dirección:</b> {{ form.recipientAddress }}</p>
              <p style="margin: 5px 0;"><b>Ciudad:</b> {{ form.recipientMunicipality }}</p>
            </div>
          </div>

          <div style="border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
            <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 16px;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Información del Paquete</h3>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <th style="padding: 8px 0; color:#070b24;">Peso (kg)</th><td style="padding: 8px 0;">{{ form.weightKg }} kg</td>
                <th style="padding: 8px 0; color:#070b24;">Cantidad</th><td style="padding: 8px 0;">{{ form.quantity }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <th style="padding: 8px 0; color:#070b24;">Dimensiones</th>
                <td style="padding: 8px 0;">{{ form.lengthCm || '-' }} x {{ form.widthCm || '-' }} x {{ form.heightCm || '-' }} cm</td>
                <th style="padding: 8px 0; color:#070b24;">Distancia</th><td style="padding: 8px 0;">{{ form.distanceKm || '-' }} km</td>
              </tr>
              <tr>
                <th style="padding: 8px 0; color:#070b24;">Descripción</th><td colspan="3" style="padding: 8px 0;">{{ form.description || 'Sin descripción' }}</td>
              </tr>
              <tr>
                <th style="padding: 8px 0; color:#070b24;">Manejo Especial</th>
                <td colspan="3" style="padding: 8px 0;">
                  <b>
                    @if (form.isFragile) {
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
    .nx-container { min-height: 100vh; background: #f8fafc; }
    .header-content { padding: 2rem 5%; background: var(--primary); color: white; }
    .header-content h1 { margin: 0; font-size: 2rem; display: flex; align-items: center; gap: 10px; }
    .header-content p { margin: 5px 0 0; opacity: 0.8; }
    
    .nx-main { padding: 2rem 5%; }
    .workflow-container { max-width: 1200px; margin: 0 auto; }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 2rem;
    }

    .nx-card {
      background: var(--bg-card); /* Soft Celeste */
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid rgba(79, 70, 229, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform var(--tr);
    }
    .nx-card:hover { transform: translateY(-4px); }

    .card-header {
      padding: 1.25rem 1.5rem;
      background: rgba(79, 70, 229, 0.04);
      border-bottom: 1px solid rgba(79, 70, 229, 0.08);
    }
    .card-header h3 { margin: 0; font-size: 1.1rem; color: #080C28; display: flex; align-items: center; gap: 8px; font-weight: 800; }

    .card-body { padding: 1.75rem; flex: 1; }

    .cols-3 { grid-template-columns: repeat(3, 1fr); }

    .success-icon { animation: bounce 1s infinite alternate; }
    @keyframes bounce { 
      from { transform: translateY(0); }
      to { transform: translateY(-10px); }
    }

    /* Ocultar elementos de UI cuando se imprime o se activa el modo print */
    .print-container {
      display: block;
      position: fixed;
      left: -9999px;
      top: 0;
      z-index: -1;
    }
    
    @media print {
      :host ::ng-deep app-sidebar,
      .print-hide { display: none !important; }
      @page { margin: 0; }
      body { margin: 0; padding: 0; background: white !important; }

      .print-container {
        display: block !important;
        position: absolute;
        top: 0; left: 0; width: 100%; height: auto;
        background: white !important; color: black !important;
        z-index: 9999;
      }
    }
  `]
})
export class NuevoEnvioComponent {
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;

  saving  = false;
  success = false;
  error   = '';
  trackingNumber = '';
  
  printMode: 'guia' | 'formulario' | null = null;
  generatingPdf = false;
  today = new Date();

  deparments = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso',
    'Escuintla', 'Guatemala', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa',
    'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
    'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'
  ];

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

  constructor(private shipmentService: ShipmentService, private router: Router) {}

  submit() {
    if (!this.form.senderName || !this.form.recipientName || !this.form.recipientAddress) {
      this.error = 'Por favor, completa los campos requeridos (*)';
      return;
    }
    
    this.form.destinationCity = this.form.recipientMunicipality || '';
    
    this.saving = true;
    this.error  = '';

    this.shipmentService.createShipment(this.form).subscribe({
      next: (r) => {
        this.saving = false;
        this.success = true;
        this.trackingNumber = (r.data as any).tracking_number || r.data.trackingNumber;
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.message || 'Error al registrar el envío';
      },
    });
  }

  resetForm() { 
    this.success = false; 
    this.trackingNumber = ''; 
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

  imprimirGuia() {
    if (this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'guia';
    
    setTimeout(async () => {
      try {
        if (!this.guiaContainer) return;
        const tracking = this.trackingNumber || 'ND0000000';
        JsBarcode("#barcodeCanvasSuccess", tracking, {
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
        this.generatingPdf = false;
      }
    }, 800);
  }

  imprimirFormulario() {
    this.printMode = 'formulario';
    setTimeout(() => {
      window.print();
      this.printMode = null;
    }, 300);
  }

  getTrackingPrefix(): string {
    return (this.trackingNumber || '').toString().substring(0, 12);
  }

  getDeptCode(): string {
    return (this.form.recipientDepartment || 'GUA').toString().substring(0, 3).toUpperCase();
  }
}
