import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment }        from '../../../core/models/shipment.model';
import { Subscription }    from 'rxjs';

@Component({
  selector: 'app-rastrear',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">🔍 Rastreo de Envío</span></div>
        <div class="nx-content">

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading && shipment) {
            <div class="nx-page-header">
              <h1>Guía {{ shipment.tracking_number }}</h1>
              <p>Estado actual: <app-status-badge [status]="shipment.current_status" /></p>
            </div>

            <div class="nx-grid cols-2">
              <!-- Detalles del envío -->
              <div class="nx-card">
                <div class="card-header"><h3>📦 Detalles del envío</h3></div>
                <div style="display:flex;flex-direction:column;gap:.75rem;">
                  <div style="display:flex;">
                    <div style="width:50%;">
                      <div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:.25rem;">Remitente</div>
                      <div style="font-weight:600;">{{ shipment.sender_name }}</div>
                      <div style="font-size:.83rem;color:var(--text-muted);">{{ shipment.origin_city }}</div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;width:32px;color:var(--accent);font-size:1.25rem;">→</div>
                    <div style="width:50%;">
                      <div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:.25rem;">Destinatario</div>
                      <div style="font-weight:600;">{{ shipment.recipient_name }}</div>
                      <div style="font-size:.83rem;color:var(--text-muted);">{{ shipment.destination_city }}</div>
                    </div>
                  </div>
                  <hr class="divider">
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;">
                    <div>
                      <div style="font-size:.72rem;color:var(--text-muted);">PESO</div>
                      <div style="font-weight:700;">{{ shipment.weight_kg }} kg</div>
                    </div>
                    <div>
                      <div style="font-size:.72rem;color:var(--text-muted);">DISTANCIA</div>
                      <div style="font-weight:700;">{{ shipment.distance_km || '—' }} km</div>
                    </div>
                    <div>
                      <div style="font-size:.72rem;color:var(--text-muted);">COSTO</div>
                      <div style="font-weight:700;color:var(--accent);">Q{{ shipment.estimated_cost }}</div>
                    </div>
                  </div>
                  @if (shipment.driver_name) {
                    <hr class="divider">
                    <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--bg-card);border-radius:var(--radius-sm);">
                      <div style="font-size:1.5rem;">🏍️</div>
                      <div>
                        <div style="font-size:.72rem;color:var(--text-muted);">REPARTIDOR ASIGNADO</div>
                        <div style="font-weight:600;">{{ shipment.driver_name }}</div>
                        <div style="font-size:.83rem;color:var(--text-muted);">{{ shipment.driver_phone }}</div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Timeline de estados -->
              <div class="nx-card">
                <div class="card-header"><h3>📋 Historial de estados</h3></div>
                <div style="position:relative;padding-left:1.5rem;">
                  @for (entry of shipment.statusHistory; track entry.id) {
                    <div style="position:relative;padding-bottom:1.25rem;">
                      <div style="position:absolute;left:-1.5rem;top:.15rem;width:12px;height:12px;border-radius:50%;border:2px solid var(--accent);background:var(--bg);z-index:1;"></div>
                      <div style="position:absolute;left:-1.44rem;top:1.1rem;bottom:0;width:1px;background:var(--border);"></div>
                      <app-status-badge [status]="entry.status" />
                      @if (entry.notes) {
                        <div style="font-size:.83rem;color:var(--text-muted);margin-top:.25rem;">{{ entry.notes }}</div>
                      }
                      <div style="font-size:.72rem;color:var(--text-muted);margin-top:.15rem;">{{ entry.created_at | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class RastrearComponent implements OnInit, OnDestroy {

  shipment: any | null = null;
  loading = true;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private shipmentService: ShipmentService,
    private trackingService: TrackingService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.shipmentService.getShipmentById(id).subscribe({
      next: (r) => {
        this.shipment = r.data;
        this.loading  = false;
        // Suscribirse a actualizaciones en tiempo real
        this.trackingService.connect();
        this.sub = this.trackingService.onShipmentStatusChange(r.data.id).subscribe((data) => {
          if (this.shipment) this.shipment.current_status = data.status;
        });
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
