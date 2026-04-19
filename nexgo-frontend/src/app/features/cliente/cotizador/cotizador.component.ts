import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { CotizacionResult, PricingRule } from '../../../core/models/shipment.model';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">calculate</span> Cotizador de Envíos</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Cotizador</h1>
            <p>Calcula el costo estimado de tu envío dentro de Guatemala</p>
          </div>

          <div class="nx-grid cols-2" style="align-items:start;">
            <!-- Formulario -->
            <div class="nx-card">
              <div class="card-header"><h3>Parámetros del envío</h3></div>

              <div class="nx-form-row cols-2">
                <div class="nx-form-group">
                  <label>Peso (kg) *</label>
                  <input class="nx-input" type="number" step="0.1" min="0.1" [(ngModel)]="form.weightKg" placeholder="Ej: 5.5" />
                </div>
                <div class="nx-form-group">
                  <label>Cantidad de paquetes</label>
                  <input class="nx-input" type="number" min="1" [(ngModel)]="form.quantity" placeholder="1" />
                </div>
              </div>

              <div class="nx-form-group">
                <label>Distancia estimada (km) *</label>
                <input class="nx-input" type="number" min="1" [(ngModel)]="form.distanceKm" placeholder="Ej: 260 (Guatemala → Huehue)" />
                <div style="margin-top:.35rem;font-size:.75rem;color:var(--text-muted);">
                  💡 Distancias de referencia: Guatemala→Quetzaltenango ~200km · Guatemala→Huehuetenango ~260km · Guatemala→Petén ~490km
                </div>
              </div>

              <div style="padding:.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:1rem;">
                <div style="font-size:.8rem;font-weight:600;color:var(--text-muted);margin-bottom:.5rem;">DIMENSIONES (opcional — para recargo)</div>
                <div class="nx-form-row cols-3">
                  <div class="nx-form-group" style="margin-bottom:0;">
                    <label>Largo (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.lengthCm" placeholder="cm" />
                  </div>
                  <div class="nx-form-group" style="margin-bottom:0;">
                    <label>Ancho (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.widthCm" placeholder="cm" />
                  </div>
                  <div class="nx-form-group" style="margin-bottom:0;">
                    <label>Alto (cm)</label>
                    <input class="nx-input" type="number" [(ngModel)]="form.heightCm" placeholder="cm" />
                  </div>
                </div>
              </div>

              @if (error) { <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div> }

              <button
                class="nx-btn btn-accent btn-block btn-lg"
                (click)="cotizar()"
                [disabled]="loading || !form.weightKg || !form.distanceKm"
              >
                @if (loading) { <span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Calculando... }
                @else { <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">calculate</span> Calcular cotización }
              </button>
            </div>

            <!-- Resultados -->
            <div>
              @if (cotizaciones.length > 0) {
                <div style="margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;">
                  <h3 style="font-family:'Space Grotesk',sans-serif;font-weight:700;">Opciones de envío</h3>
                  <span style="font-size:.78rem;color:var(--text-muted);">— {{ cotizaciones.length }} tarifas disponibles</span>
                </div>

                @for (c of cotizaciones; track c.ruleId; let i = $index) {
                  <div
                    class="nx-card"
                    style="margin-bottom:.75rem;cursor:pointer;position:relative;overflow:hidden;"
                    [style.border-color]="i === 0 ? 'var(--accent)' : 'var(--border)'"
                    (click)="selectRule(c)"
                  >
                    @if (i === 0) {
                      <div style="position:absolute;top:.5rem;right:.75rem;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);">Recomendado</div>
                    }
                    <div style="display:flex;align-items:center;gap:1rem;">
                      <div>
                        <div style="font-weight:700;font-size:.95rem;">{{ c.ruleName }}</div>
                        <div style="font-size:.78rem;color:var(--text-muted);margin-top:.2rem;">
                          Base Q{{ c.breakdown.baseCost }} · Peso Q{{ c.breakdown.weightCost }} · Dist. Q{{ c.breakdown.distanceCost }}
                        </div>
                      </div>
                      <div style="margin-left:auto;text-align:right;flex-shrink:0;">
                        <div style="font-size:1.6rem;font-weight:800;font-family:'Space Grotesk',sans-serif;color:var(--accent);">Q{{ c.totalCost | number:'1.2-2' }}</div>
                        <div style="font-size:.72rem;color:var(--text-muted);">Costo estimado</div>
                      </div>
                    </div>
                  </div>
                }

                <button class="nx-btn btn-primary btn-block" routerLink="/cliente/nuevo-envio">
                  <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_post_office</span> Registrar envío con esta tarifa →
                </button>
              } @else if (!loading) {
                <div class="nx-empty">
                  <div class="empty-icon" style="font-size:4rem;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">calculate</span></div>
                  <h3>Ingresa los datos</h3>
                  <p>Completa los campos y haz clic en "Calcular cotización" para ver las opciones disponibles</p>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class CotizadorComponent {

  form = { weightKg: 0, distanceKm: 0, quantity: 1, lengthCm: 0, widthCm: 0, heightCm: 0 };
  cotizaciones: CotizacionResult[] = [];
  loading  = false;
  error    = '';
  selected: CotizacionResult | null = null;

  constructor(private shipmentService: ShipmentService) {}

  cotizar() {
    if (!this.form.weightKg || !this.form.distanceKm) {
      this.error = 'Peso y distancia son requeridos';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.shipmentService.cotizar(this.form).subscribe({
      next: (r) => {
        this.cotizaciones = r.data.cotizaciones;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Error al cotizar';
        this.loading = false;
      },
    });
  }

  selectRule(c: CotizacionResult) { this.selected = c; }
}
