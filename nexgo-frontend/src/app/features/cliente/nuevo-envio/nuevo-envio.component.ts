import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { CreateShipmentRequest } from '../../../core/models/shipment.model';

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
                <button class="nx-btn btn-secondary" (click)="imprimirGuia()" style="background:var(--accent);color:black;font-weight:bold;border:none;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">print</span> Imprimir GUÍA</button>
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
        <div style="display: flex; justify-content: center; align-items: flex-start; padding: 5mm; height: 100vh;">
          <div>
            <div class="guia-box">
              
              <!-- Row 1: Remitente -->
              <div class="g-row" style="flex:1;">
                <div class="v-text-dark">Remitente</div>
                <div style="flex:1; display:flex; justify-content:space-between; align-items:flex-start; padding: 4px 8px;">
                  <div>
                    <div style="font-size:16px;"><b>Nombre: </b>{{ form.senderName | slice:0:30 }}</div>
                    <div style="font-size:14px; margin-top:2px;">Tel. {{ form.senderPhone }}</div>
                  </div>
                  <div style="display:flex; align-items:center;">
                    <div style="font-size:32px; line-height:1; margin-right: 14px;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span></div>
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
                    <div style="font-size:15px; margin-bottom:2px;"><b>Nombre: </b>{{ form.recipientName | slice:0:35 }}</div>
                    Tel: {{ form.recipientPhone }}<br>
                    Dirección: {{ form.recipientAddress | slice:0:60 }},<br>
                    {{ form.destinationCity }}, Guatemala Guatemala<br>
                    Favor Cobrar Q0.00 con envío incluido
                  </div>
                  <div style="border: 2px solid black; font-weight:800; font-size:24px; padding: 6px 10px; margin-left: 8px;">
                    DOM
                  </div>
                </div>
              </div>

              <!-- Row 3: Codes -->
              <div class="g-row" style="flex:2;">
                <div class="v-text-light">Guía No.<br>{{ trackingNumber || 'ND1000004' }}</div>
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
                    PIEZA<br><b style="font-size:24px; line-height:1.1;">01</b>DE<br><b style="font-size:20px; line-height:1;">{{ form.quantity | number:'2.0' }}</b>
                  </div>
                  <div style="flex:1; border-bottom:2px solid black; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">
                    PESO lb<br><b style="font-size:24px; line-height:1.1;">{{ form.weightKg }}</b>DE<br><b style="font-size:20px; line-height:1;">999</b>
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
      display: none;
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

  step = 1;
  saving  = false;
  success = false;
  error   = '';
  trackingNumber = '';
  
  printMode: 'guia' | 'formulario' | null = null;
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
    this.printMode = 'guia';
    setTimeout(() => {
      window.print();
      this.printMode = null;
    }, 300);
  }

  imprimirFormulario() {
    this.printMode = 'formulario';
    setTimeout(() => {
      window.print();
      this.printMode = null;
    }, 300);
  }
}
