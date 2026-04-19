import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment }            from '../../../core/models/shipment.model';

@Component({
  selector: 'app-actualizar-estado',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">🔄 Actualizar Estado</span></div>
        <div class="nx-content">

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading && shipment) {
            <div class="nx-page-header">
              <h1>Actualizar Envío</h1>
              <p>Guía: <span class="font-mono" style="color:var(--accent);">{{ shipment.tracking_number }}</span></p>
            </div>

            <div class="nx-grid cols-2" style="align-items:start;">
              <!-- Detalles guía -->
              <div class="nx-card">
                <div class="card-header">
                  <h3>Detalles de entrega</h3>
                  <app-status-badge [status]="shipment.current_status" />
                </div>

                <div style="display:flex;flex-direction:column;gap:.75rem;">
                  <div style="padding:.75rem;background:var(--bg-card);border-radius:var(--radius-sm);">
                    <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.35rem;">DESTINATARIO</div>
                    <div style="font-weight:700;font-size:1rem;">{{ shipment.recipient_name }}</div>
                    <div style="color:var(--text-muted);font-size:.83rem;">📞 {{ shipment.recipient_phone }}</div>
                  </div>

                  <div style="padding:.75rem;background:var(--bg-card);border-radius:var(--radius-sm);">
                    <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.35rem;">DIRECCIÓN DE ENTREGA</div>
                    <div style="font-weight:600;"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span> {{ shipment.recipient_address }}</div>
                    <div style="color:var(--accent);font-size:.83rem;margin-top:.25rem;">{{ shipment.destination_city }}</div>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
                    <div style="padding:.6rem .75rem;background:var(--bg-card);border-radius:var(--radius-sm);text-align:center;">
                      <div style="font-size:.72rem;color:var(--text-muted);">PESO</div>
                      <div style="font-weight:700;">{{ shipment.weight_kg }} kg</div>
                    </div>
                    <div style="padding:.6rem .75rem;background:var(--bg-card);border-radius:var(--radius-sm);text-align:center;">
                      <div style="font-size:.72rem;color:var(--text-muted);">PAQUETES</div>
                      <div style="font-weight:700;">{{ shipment.quantity }}</div>
                    </div>
                  </div>

                  @if (shipment.is_fragile) {
                    <div style="display:flex;align-items:center;gap:.5rem;padding:.6rem .75rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-sm);">
                      <span>🫧</span>
                      <span style="font-size:.83rem;color:#F59E0B;font-weight:600;">Paquete frágil — Manejo especial</span>
                    </div>
                  }
                  @if (shipment.description) {
                    <div style="padding:.6rem .75rem;background:var(--bg-card);border-radius:var(--radius-sm);">
                      <div style="font-size:.72rem;color:var(--text-muted);">DESCRIPCIÓN</div>
                      <div style="font-size:.875rem;">{{ shipment.description }}</div>
                    </div>
                  }
                </div>
              </div>

              <!-- Formulario de actualización -->
              <div class="nx-card">
                <div class="card-header"><h3>Cambiar estado</h3></div>

                @if (success) {
                  <div class="nx-alert alert-success"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span> Estado actualizado correctamente</div>
                }
                @if (error) {
                  <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ error }}</div>
                }

                <div class="nx-form-group">
                  <label>Nuevo estado *</label>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">
                    @for (s of validStatuses; track s.value) {
                      <button
                        class="nx-btn"
                        [class]="newStatus === s.value ? 'btn-primary' : 'btn-ghost'"
                        (click)="newStatus = s.value"
                        style="justify-content:flex-start;gap:.5rem;"
                      >
                        <span>{{ s.icon }}</span>{{ s.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="nx-form-group">
                  <label>Notas (opcional)</label>
                  <input class="nx-input" [(ngModel)]="notes" placeholder="Observaciones del estado..." />
                </div>

                <button
                  class="nx-btn btn-accent btn-block btn-lg"
                  (click)="update()"
                  [disabled]="saving || !newStatus"
                >
                  @if (saving) { <span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span> Actualizando... }
                  @else { <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span> Confirmar cambio de estado }
                </button>

                <button class="nx-btn btn-ghost btn-block" style="margin-top:.5rem;" (click)="router.navigate(['/repartidor/guias'])">
                  ← Volver a mis guías
                </button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class ActualizarEstadoComponent implements OnInit {

  shipment: any = null;
  loading  = true;
  saving   = false;
  success  = false;
  error    = '';
  newStatus = '';
  notes     = '';

  validStatuses = [
    { value: 'RECOGIDO',    label: 'Recogido',    icon: '📥' },
    { value: 'EN_TRANSITO', label: 'En tránsito', icon: '<span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_shipping</span>' },
    { value: 'EN_DESTINO',  label: 'En destino',  icon: '<span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">location_on</span>' },
    { value: 'ENTREGADO',   label: 'Entregado',   icon: '<span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span>' },
    { value: 'CANCELADO',   label: 'Cancelado',   icon: '❌' },
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private shipmentService: ShipmentService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.shipmentService.getShipmentById(id).subscribe({
      next: (r) => { this.shipment = r.data; this.newStatus = (r.data as any).current_status || r.data.currentStatus; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  update() {
    if (!this.newStatus) return;
    this.saving  = true;
    this.error   = '';
    this.success = false;

    this.shipmentService.updateStatus(this.shipment.id, this.newStatus, this.notes).subscribe({
      next: () => {
        this.saving  = false;
        this.success = true;
        this.shipment.current_status = this.newStatus;
        setTimeout(() => this.router.navigate(['/repartidor/guias']), 1500);
      },
      error: (e) => { this.saving = false; this.error = e?.error?.message || 'Error al actualizar'; },
    });
  }
}
