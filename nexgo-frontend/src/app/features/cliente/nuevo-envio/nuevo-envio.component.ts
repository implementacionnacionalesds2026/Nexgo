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
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_post_office</span> Registrar Nuevo Envío</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Nueva Guía de Envío</h1>
            <p>Completa el formulario para registrar tu envío</p>
          </div>

          <!-- Steps indicator -->
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:2rem;">
            @for (s of steps; track s.n) {
              <div style="display:flex;align-items:center;gap:.5rem;">
                <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;transition:all .25s;"
                     [style.background]="step >= s.n ? 'linear-gradient(135deg,var(--primary),var(--accent-2))' : 'var(--bg-card)'"
                     [style.color]="step >= s.n ? 'white' : 'var(--text-muted)'"
                     [style.border]="step >= s.n ? 'none' : '1px solid var(--border)'">
                  {{ step > s.n ? '✓' : s.n }}
                </div>
                <span style="font-size:.75rem;font-weight:600;" [style.color]="step >= s.n ? 'var(--text)' : 'var(--text-muted)'">{{ s.label }}</span>
                @if (s.n < steps.length) { <div style="width:30px;height:1px;background:var(--border);margin:0 .25rem;"></div> }
              </div>
            }
          </div>

          @if (success) {
            <div class="nx-card" style="text-align:center;padding:3rem;">
              <div style="font-size:4rem;margin-bottom:1rem;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span></div>
              <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.5rem;margin-bottom:.5rem;">¡Envío registrado!</h2>
              <p style="color:var(--text-muted);margin-bottom:1rem;">Tu número de guía es:</p>
              <div class="font-mono" style="font-size:1.75rem;font-weight:800;color:var(--accent);letter-spacing:.05em;margin-bottom:2rem;">{{ trackingNumber }}</div>
              <div style="display:flex;gap:.75rem;justify-content:center;margin-top:2rem;">
                <button class="nx-btn btn-ghost" (click)="resetForm()"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_post_office</span> Nuevo envío</button>
                <button class="nx-btn btn-primary" (click)="goToEnvios()"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Ver mis envíos</button>
              </div>
              <div style="display:flex;gap:.75rem;justify-content:center;margin-top:1rem;">
                <button class="nx-btn btn-secondary" (click)="imprimirGuia()" [disabled]="generatingPdf" style="background:var(--accent);color:black;font-weight:bold;border:none;">
                  <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">print</span> 
                  {{ generatingPdf ? 'Generando...' : 'Imprimir GUÍA' }}
                </button>
                <button class="nx-btn btn-secondary" (click)="imprimirFormulario()" style="background:var(--accent-2);color:white;font-weight:bold;border:none;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">description</span> Imprimir Formulario</button>
              </div>
            </div>
          }

          @if (!success) {
            <div class="nx-card">
              <!-- Step 1: Remitente -->
              @if (step === 1) {
                <div class="card-header"><h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> Datos del Remitente</h3></div>
                <div class="nx-form-row cols-2">
                  <div class="nx-form-group">
                    <label>Nombre del remitente *</label>
                    <input class="nx-input" [(ngModel)]="form.senderName" placeholder="Tu nombre o empresa" />
                  </div>
                  <div class="nx-form-group">
                    <label>Teléfono</label>
                    <input class="nx-input" [(ngModel)]="form.senderPhone" placeholder="502XXXXXXXX" />
                  </div>
                </div>
                <div class="nx-form-group">
                  <label>Dirección de origen *</label>
                  <input class="nx-input" [(ngModel)]="form.senderAddress" placeholder="Calle y número, Zona, Ciudad" />
                </div>
                <div class="nx-form-group">
                  <label>Ciudad de origen *</label>
                  <select class="nx-input" [(ngModel)]="form.originCity">
                    @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                  </select>
                </div>
              }

              <!-- Step 2: Destinatario -->
              @if (step === 2) {
                <div class="card-header"><h3>📫 Datos del Destinatario</h3></div>
                <div class="nx-form-row cols-2">
                  <div class="nx-form-group">
                    <label>Nombre del destinatario *</label>
                    <input class="nx-input" [(ngModel)]="form.recipientName" placeholder="Nombre completo" />
                  </div>
                  <div class="nx-form-group">
                    <label>Teléfono</label>
                    <input class="nx-input" [(ngModel)]="form.recipientPhone" placeholder="502XXXXXXXX" />
                  </div>
                </div>
                <div class="nx-form-group">
                  <label>Dirección de destino *</label>
                  <input class="nx-input" [(ngModel)]="form.recipientAddress" placeholder="Calle y número, Zona, Ciudad" />
                </div>
                <div class="nx-form-group">
                  <label>Ciudad de destino *</label>
                  <select class="nx-input" [(ngModel)]="form.destinationCity">
                    @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                  </select>
                </div>
              }

              <!-- Step 3: Paquete -->
              @if (step === 3) {
                <div class="card-header"><h3><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span> Información del Paquete</h3></div>
                <div class="nx-form-row cols-2">
                  <div class="nx-form-group">
                    <label>Peso (kg) *</label>
                    <input class="nx-input" type="number" step="0.1" [(ngModel)]="form.weightKg" />
                  </div>
                  <div class="nx-form-group">
                    <label>Cantidad de paquetes</label>
                    <input class="nx-input" type="number" min="1" [(ngModel)]="form.quantity" />
                  </div>
                  <div class="nx-form-group">
                    <label>Largo (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.lengthCm" />
                  </div>
                  <div class="nx-form-group">
                    <label>Ancho (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.widthCm" />
                  </div>
                  <div class="nx-form-group">
                    <label>Alto (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.heightCm" />
                  </div>
                  <div class="nx-form-group">
                    <label>Distancia (km)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.distanceKm" />
                  </div>
                </div>
                <div class="nx-form-group">
                  <label>Descripción del contenido</label>
                  <input class="nx-input" [(ngModel)]="form.description" placeholder="Documentos, ropa, electrónicos..." />
                </div>
                <div style="display:flex;align-items:center;gap:.75rem;">
                  <input type="checkbox" id="fragile" [(ngModel)]="form.isFragile" style="width:16px;height:16px;accent-color:var(--accent);" />
                  <label for="fragile" style="font-size:.875rem;cursor:pointer;">🫧 Paquete frágil (manejo especial)</label>
                </div>
              }

              @if (error) { <div class="nx-alert alert-error" style="margin-top:1rem;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div> }

              <!-- Navigation buttons -->
              <div style="display:flex;justify-content:space-between;margin-top:1.5rem;">
                <button class="nx-btn btn-ghost" (click)="prevStep()" [style.visibility]="step > 1 ? 'visible' : 'hidden'">
                  ← Anterior
                </button>
                @if (step < 3) {
                  <button class="nx-btn btn-primary" (click)="nextStep()">Siguiente →</button>
                } @else {
                  <button class="nx-btn btn-accent" (click)="submit()" [disabled]="saving">
                    @if (saving) { <span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Registrando... }
                    @else { <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">rocket_launch</span> Registrar envío }
                  </button>
                }
              </div>
            </div>
          }
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
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">4</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Orden</div></div>
                  <div style="text-align:center;"><div style="font-size:10px; font-weight:900; color: black;">4</div><div style="font-size:6.5px; font-weight:bold; color: black;">No. Ticket</div></div>
                </div>
              </div>
            </div>

            <!-- Row 2: DESTINATARIO -->
            <div style="display:flex; border-bottom: 2px solid black; height: 95px;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: black; color: white; width: 22px; font-size: 10px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;">Destinatario</div>
              <div style="flex:1; padding: 4px; display:flex; flex-direction:column; justify-content:center; overflow:hidden;">
                <div style="font-size: 16px; font-weight: 800; color: black;">Nombre: {{ form.recipientName }}</div>
                <div style="font-size: 11px; font-weight: 700; color: black;">Tel: {{ form.recipientPhone }}</div>
                <div style="font-size: 11px; font-weight: 500; line-height: 1.1; color: black;">Dirección: {{ form.recipientAddress }}, {{ form.destinationCity }}</div>
                <div style="font-size: 11px; font-weight: 700; margin-top:2px; color: black;">Favor Cobrar con envío incluido</div>
              </div>
              <div style="width: 80px; border-left: 2px solid black; display: flex; align-items: center; justify-content: center;">
                <div style="border: 3px solid black; font-size: 24px; font-weight: 900; padding: 6px 4px; color: black;">DOM</div>
              </div>
            </div>

            <!-- Row 3: MIDDLE SECTION (BARCODE) -->
            <div style="display:flex; border-bottom: 2px solid black; flex: 1; align-items:stretch;">
              <div style="writing-mode: vertical-rl; transform: rotate(180deg); background: white; color: black; width: 22px; font-size: 9px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; border-right: 2px solid black; font-family: monospace;">Guía No.<br>{{ trackingNumber | slice:0:12 }}</div>
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
                <div style="border: 3px solid black; font-size: 64px; font-weight: 900; padding: 4px 10px; line-height: 1; color: black;">GUA</div>
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
              <p style="margin: 5px 0;"><b>Ciudad:</b> {{ form.destinationCity }}</p>
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

      /* Estilos específicos de la Guía */
      .guia-box {
        width: 385px;
        height: 375px;
        border: 2px solid black;
        box-sizing: border-box;
        background: white;
        color: black;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .g-row { display: flex; border-bottom: 2px solid black; }
      .v-text-dark {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        background: black;
        color: white;
        width: 24px;
        text-align: center;
        font-size: 10px;
        font-weight: bold;
        padding: 4px 0;
        border-right: 2px solid black;
      }
      .v-text-light {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        background: white;
        color: black;
        width: 24px;
        text-align: center;
        font-size: 11px;
        font-weight: bold;
        padding: 4px 0;
        border-right: 2px solid black;
        line-height:1.2;
      }
    }
  `]
})
export class NuevoEnvioComponent {
  @ViewChild('guiaContainer') guiaContainer!: ElementRef;

  step = 1;
  saving  = false;
  success = false;
  error   = '';
  trackingNumber = '';
  
  printMode: 'guia' | 'formulario' | null = null;
  generatingPdf = false;
  today = new Date();

  steps = [
    { n: 1, label: 'Remitente' },
    { n: 2, label: 'Destinatario' },
    { n: 3, label: 'Paquete' },
  ];

  cities = [
    'Guatemala', 'Mixco', 'Villa Nueva', 'San Juan Sacatepéquez',
    'Quetzaltenango', 'Suchitepéquez', 'Huehuetenango', 'San Marcos',
    'Alta Verapaz', 'Baja Verapaz', 'El Petén', 'Izabal',
    'Zacapa', 'Chiquimula', 'Jutiapa', 'Santa Rosa', 'Escuintla',
    'Chimaltenango', 'Sololá', 'Totonicapán', 'Retalhuleu',
  ];

  form: CreateShipmentRequest = {
    senderName: '', senderPhone: '', senderAddress: '', originCity: 'Guatemala',
    recipientName: '', recipientPhone: '', recipientAddress: '', destinationCity: 'Huehuetenango',
    weightKg: 1, quantity: 1, isFragile: false,
  };

  constructor(private shipmentService: ShipmentService, private router: Router) {}

  nextStep() {
    if (this.step === 1 && (!this.form.senderName || !this.form.senderAddress)) {
      this.error = 'Completa los campos requeridos del remitente'; return;
    }
    if (this.step === 2 && (!this.form.recipientName || !this.form.recipientAddress)) {
      this.error = 'Completa los campos requeridos del destinatario'; return;
    }
    this.error = '';
    this.step++;
  }

  prevStep() { this.step--; this.error = ''; }

  submit() {
    if (!this.form.weightKg) { this.error = 'Completa el peso del paquete'; return; }
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

  resetForm() { this.step = 1; this.success = false; this.trackingNumber = ''; this.printMode = null; }
  goToEnvios() { this.router.navigate(['/cliente/mis-envios']); }

  imprimirGuia() {
    if (this.generatingPdf) return;
    this.generatingPdf = true;
    this.printMode = 'guia';
    
    // Esperar a que Angular renderice el contenedor
    setTimeout(async () => {
      try {
        if (!this.guiaContainer) return;
        
        const tracking = this.trackingNumber || 'ND0000000';
        
        // Generar Código de Barras
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
}
