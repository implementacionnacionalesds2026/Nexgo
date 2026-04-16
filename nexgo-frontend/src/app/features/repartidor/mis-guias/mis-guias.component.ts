import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterLink }          from '@angular/router';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment }            from '../../../core/models/shipment.model';

@Component({
  selector: 'app-mis-guias',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">📋 Mis Guías Asignadas</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Mis Guías</h1>
            <p>Envíos asignados para entrega</p>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <div style="display:flex;flex-direction:column;gap:.75rem;">
              @for (s of shipments; track s.id) {
                <div class="nx-card" style="display:flex;align-items:center;gap:1.25rem;">
                  <div style="width:48px;height:48px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">📦</div>
                  <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.25rem;">
                      <span class="font-mono" style="font-size:.85rem;font-weight:700;color:var(--accent);">{{ s.tracking_number }}</span>
                      <app-status-badge [status]="s.current_status" />
                    </div>
                    <div style="font-size:.875rem;font-weight:600;">{{ s.sender_name }} → {{ s.recipient_name }}</div>
                    <div style="font-size:.8rem;color:var(--text-muted);">{{ s.origin_city }} → {{ s.destination_city }}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:.15rem;">📍 {{ s.recipient_address }}</div>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:.5rem;flex-shrink:0;">
                    <a [routerLink]="['/repartidor/actualizar', s.id]" class="nx-btn btn-primary btn-sm">Actualizar estado</a>
                    <div style="text-align:right;font-size:.75rem;color:var(--text-muted);">{{ s.weight_kg }} kg</div>
                  </div>
                </div>
              }
              @if (shipments.length === 0) {
                <div class="nx-empty">
                  <div class="empty-icon">📋</div>
                  <h3>Sin guías asignadas</h3>
                  <p>No tienes envíos asignados por el momento</p>
                </div>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class MisGuiasComponent implements OnInit {

  shipments: any[] = [];
  loading = true;

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() {
    this.shipmentService.getShipments({ limit: 50 }).subscribe({
      next: (r) => { this.shipments = r.data.data as any[]; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }
}
