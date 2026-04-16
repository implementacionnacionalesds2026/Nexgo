import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { Router, RouterLink }  from '@angular/router';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { Shipment }            from '../../../core/models/shipment.model';

@Component({
  selector: 'app-mis-envios',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title">📦 Mis Envíos</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Historial de Envíos</h1>
            <p>Todos tus envíos registrados en Nexgo</p>
            <div class="header-actions">
              <a routerLink="/cliente/nuevo-envio" class="nx-btn btn-accent">📮 Nuevo envío</a>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <!-- Stats row -->
            <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
              <div class="nx-kpi-card">
                <div class="kpi-icon">📦</div>
                <div class="kpi-label">Total envíos</div>
                <div class="kpi-value">{{ total }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">🟡</div>
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending);">{{ countByStatus('PENDIENTE') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">🚚</div>
                <div class="kpi-label">En tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ countByStatus('EN_TRANSITO') }}</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon">✅</div>
                <div class="kpi-label">Entregados</div>
                <div class="kpi-value" style="color:var(--status-delivered);">{{ countByStatus('ENTREGADO') }}</div>
              </div>
            </div>

            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead><tr>
                    <th>Guía</th><th>Fecha</th><th>Origen → Destino</th><th>Peso</th><th>Costo est.</th><th>Estado</th><th></th>
                  </tr></thead>
                  <tbody>
                    @for (s of shipments; track s.id) {
                      <tr>
                        <td class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</td>
                        <td style="font-size:.8rem;">{{ s.created_at | date:'dd/MM/yy' }}</td>
                        <td style="font-size:.83rem;">{{ s.origin_city }} → {{ s.destination_city }}</td>
                        <td style="font-size:.83rem;">{{ s.weight_kg }} kg</td>
                        <td style="font-size:.83rem;font-weight:600;color:var(--accent);">Q{{ s.estimated_cost }}</td>
                        <td><app-status-badge [status]="s.current_status" /></td>
                        <td>
                          <a [routerLink]="['/cliente/rastrear', s.id]" class="nx-btn btn-ghost btn-sm">🔍</a>
                        </td>
                      </tr>
                    }
                    @if (shipments.length === 0) {
                      <tr><td colspan="7">
                        <div class="nx-empty">
                          <div class="empty-icon">📭</div>
                          <h3>Sin envíos aún</h3>
                          <p><a routerLink="/cliente/nuevo-envio" style="color:var(--accent)">Registra tu primer envío</a></p>
                        </div>
                      </td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class MisEnviosComponent implements OnInit {

  shipments: any[] = [];
  total   = 0;
  loading = true;

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() {
    this.shipmentService.getShipments({ limit: 50 }).subscribe({
      next: (r) => {
        this.shipments = r.data.data;
        this.total     = r.data.total;
        this.loading   = false;
      },
      error: () => { this.loading = false; },
    });
  }

  countByStatus(status: string): number {
    return this.shipments.filter((s: any) => s.current_status === status).length;
  }
}
