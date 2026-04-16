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
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">📮 Registrar Nuevo Envío</span></div>
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
              <div style="font-size:4rem;margin-bottom:1rem;">✅</div>
              <h2 style="font-family:'Space Grotesk',sans-serif;font-size:1.5rem;margin-bottom:.5rem;">¡Envío registrado!</h2>
              <p style="color:var(--text-muted);margin-bottom:1rem;">Tu número de guía es:</p>
              <div class="font-mono" style="font-size:1.75rem;font-weight:800;color:var(--accent);letter-spacing:.05em;margin-bottom:2rem;">{{ trackingNumber }}</div>
              <div style="display:flex;gap:.75rem;justify-content:center;">
                <button class="nx-btn btn-ghost" (click)="resetForm()">📮 Nuevo envío</button>
                <button class="nx-btn btn-primary" (click)="goToEnvios()">📦 Ver mis envíos</button>
              </div>
            </div>
          }

          @if (!success) {
            <div class="nx-card">
              <!-- Step 1: Remitente -->
              @if (step === 1) {
                <div class="card-header"><h3>📍 Datos del Remitente</h3></div>
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
                <div class="card-header"><h3>📦 Información del Paquete</h3></div>
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

              @if (error) { <div class="nx-alert alert-error" style="margin-top:1rem;">⚠️ {{ error }}</div> }

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
                    @else { 🚀 Registrar envío }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class NuevoEnvioComponent {

  step = 1;
  saving  = false;
  success = false;
  error   = '';
  trackingNumber = '';

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

  resetForm() { this.step = 1; this.success = false; this.trackingNumber = ''; }
  goToEnvios() { this.router.navigate(['/cliente/mis-envios']); }
}
