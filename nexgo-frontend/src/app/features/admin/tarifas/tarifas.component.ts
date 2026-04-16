import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { AdminService }        from '../../../core/services/admin.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { PricingRule }         from '../../../core/models/shipment.model';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">💰 Configuración de Tarifas</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Tarifas de Envío</h1>
            <p>Parametrización de costos según peso, distancia, dimensiones y cantidad</p>
            <div class="header-actions">
              <button class="nx-btn btn-accent" (click)="openCreate()">➕ Nueva Tarifa</button>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <div class="nx-grid cols-2">
              @for (r of rules; track r.id) {
                <div class="nx-card" [style.opacity]="r.isActive ? '1' : '0.5'">
                  <div class="card-header">
                    <h3>{{ r.name }}</h3>
                    <div style="display:flex;gap:.5rem;">
                      <span style="font-size:.72rem;padding:.2rem .6rem;border-radius:999px;" [style.background]="r.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'" [style.color]="r.isActive ? '#34D399' : '#F87171'">
                        {{ r.isActive ? '● Activa' : '○ Inactiva' }}
                      </span>
                      <button class="nx-btn btn-ghost btn-sm" (click)="openEdit(r)">✏️</button>
                    </div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
                    <div class="tarifa-item">
                      <div class="ta-label">Tarifa base</div>
                      <div class="ta-value">Q{{ r.base_price | number:'1.2-2' }}</div>
                    </div>
                    <div class="tarifa-item">
                      <div class="ta-label">Por kg</div>
                      <div class="ta-value">Q{{ r.price_per_kg | number:'1.2-2' }}/kg</div>
                    </div>
                    <div class="tarifa-item">
                      <div class="ta-label">Por km</div>
                      <div class="ta-value">Q{{ r.price_per_km | number:'1.2-2' }}/km</div>
                    </div>
                    <div class="tarifa-item">
                      <div class="ta-label">Paq. adicional</div>
                      <div class="ta-value">Q{{ r.price_per_extra_pkg | number:'1.2-2' }}</div>
                    </div>
                    <div class="tarifa-item">
                      <div class="ta-label">Recargo dim.</div>
                      <div class="ta-value">Q{{ r.dimension_surcharge | number:'1.2-2' }}</div>
                    </div>
                    <div class="tarifa-item">
                      <div class="ta-label">Peso máx.</div>
                      <div class="ta-value">{{ r.max_weight_kg }} kg</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>

    @if (showModal) {
      <div class="nx-modal-backdrop" (click)="closeModal()">
        <div class="nx-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editMode ? '✏️ Editar Tarifa' : '➕ Nueva Tarifa' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="nx-form-group">
              <label>Nombre de la tarifa</label>
              <input class="nx-input" [(ngModel)]="form.name" placeholder="Ej: Tarifa Express" />
            </div>
            <div class="nx-form-row cols-2">
              <div class="nx-form-group">
                <label>Precio base (Q)</label>
                <input class="nx-input" type="number" [(ngModel)]="form.basePrice" />
              </div>
              <div class="nx-form-group">
                <label>Por kg (Q)</label>
                <input class="nx-input" type="number" step="0.01" [(ngModel)]="form.pricePerKg" />
              </div>
              <div class="nx-form-group">
                <label>Por km (Q)</label>
                <input class="nx-input" type="number" step="0.01" [(ngModel)]="form.pricePerKm" />
              </div>
              <div class="nx-form-group">
                <label>Paq. adicional (Q)</label>
                <input class="nx-input" type="number" step="0.01" [(ngModel)]="form.pricePerExtraPkg" />
              </div>
              <div class="nx-form-group">
                <label>Recargo dimensión (Q)</label>
                <input class="nx-input" type="number" step="0.01" [(ngModel)]="form.dimensionSurcharge" />
              </div>
              <div class="nx-form-group">
                <label>Peso máximo (kg)</label>
                <input class="nx-input" type="number" [(ngModel)]="form.maxWeightKg" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="nx-btn btn-ghost" (click)="closeModal()">Cancelar</button>
            <button class="nx-btn btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Guardando...' : 'Guardar tarifa' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tarifa-item {
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      padding: .6rem .75rem;
    }
    .ta-label { font-size:.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
    .ta-value  { font-size:1rem; font-weight:700; color:var(--accent); margin-top:.15rem; }
  `],
})
export class TarifasComponent implements OnInit {

  rules:    any[] = [];
  loading   = true;
  saving    = false;
  showModal = false;
  editMode  = false;
  selected: any = null;
  form: any = { name:'', basePrice:0, pricePerKg:0, pricePerKm:0, pricePerExtraPkg:0, dimensionSurcharge:0, maxWeightKg:100 };

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getPricingRules().subscribe({
      next: (r) => { this.rules = r.data; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  openCreate() {
    this.editMode = false;
    this.form = { name:'', basePrice:0, pricePerKg:0, pricePerKm:0, pricePerExtraPkg:0, dimensionSurcharge:0, maxWeightKg:100 };
    this.showModal = true;
  }

  openEdit(r: any) {
    this.editMode = true;
    this.selected = r;
    this.form = { name: r.name, basePrice: r.base_price, pricePerKg: r.price_per_kg, pricePerKm: r.price_per_km,
      pricePerExtraPkg: r.price_per_extra_pkg, dimensionSurcharge: r.dimension_surcharge, maxWeightKg: r.max_weight_kg };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    this.saving = true;
    const obs = this.editMode
      ? this.adminService.updatePricingRule(this.selected.id, this.form)
      : this.adminService.createPricingRule(this.form);
    obs.subscribe({ next: () => { this.saving = false; this.closeModal(); this.load(); }, error: () => { this.saving = false; } });
  }
}
