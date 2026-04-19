import { Component, OnInit }  from '@angular/core';
import { CommonModule }         from '@angular/common';
import { AdminService }         from '../../../core/services/admin.service';
import { SidebarComponent }     from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RouterLink }           from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, StatusBadgeComponent, RouterLink],
  template: `
    <div class="nx-layout">
      <app-sidebar />

      <main class="nx-main">
        <!-- Navbar -->
        <div class="nx-navbar">
          <span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">dashboard</span> Dashboard</span>
          <div class="navbar-right">
            <span style="font-size:.8rem;color:var(--text-muted);">{{today}}</span>
          </div>
        </div>

        <div class="nx-content">

          <!-- Page Header -->
          <div class="nx-page-header">
            <h1>Panel de Control</h1>
            <p>Resumen general de operaciones · Nexgo</p>
          </div>

          @if (loading) {
            <div class="nx-loader"><div class="spinner"></div><span>Cargando datos...</span></div>
          }

          @if (!loading && stats) {
            <!-- KPI Grid -->
            <div class="nx-grid kpi-grid" style="margin-bottom:2rem;">
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">inventory_2</span></div>
                <div class="kpi-label">Total Envíos</div>
                <div class="kpi-value">{{ stats.totalEnvios | number }}</div>
                <div class="kpi-sub">Registrados en el sistema</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">pending_actions</span></div>
                <div class="kpi-label">Pendientes</div>
                <div class="kpi-value" style="color:var(--status-pending)">{{ stats.porEstado['PENDIENTE'] || 0 }}</div>
                <div class="kpi-sub">Esperando recolección</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">local_shipping</span></div>
                <div class="kpi-label">En Tránsito</div>
                <div class="kpi-value" style="color:#60A5FA;">{{ stats.porEstado['EN_TRANSITO'] || 0 }}</div>
                <div class="kpi-sub">En ruta de entrega</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">check_circle</span></div>
                <div class="kpi-label">Entregados</div>
                <div class="kpi-value" style="color:var(--status-delivered)">{{ stats.porEstado['ENTREGADO'] || 0 }}</div>
                <div class="kpi-sub">Completados hoy</div>
              </div>
              <div class="nx-kpi-card">
                <div class="kpi-icon"><span class="material-symbols-outlined" style="font-size:inherit;">motorcycle</span></div>
                <div class="kpi-label">Repartidores Activos</div>
                <div class="kpi-value" style="color:var(--accent);">{{ stats.repartidoresActivos }}</div>
                <div class="kpi-sub">Últimos 60 minutos</div>
              </div>
            </div>

            <!-- Content Grid -->
            <div class="nx-grid cols-2">
              <!-- Últimos Envíos -->
              <div class="nx-card">
                <div class="card-header">
                  <h3>Últimos Envíos</h3>
                  <a routerLink="/admin/envios" class="nx-btn btn-ghost btn-sm">Ver todos →</a>
                </div>
                <div class="nx-table-wrap">
                  <table class="nx-table">
                    <thead>
                      <tr>
                        <th>Guía</th>
                        <th>Origen → Destino</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of stats.ultimosEnvios; track s.tracking_number) {
                        <tr>
                          <td class="font-mono" style="font-size:.8rem;">{{ s.tracking_number }}</td>
                          <td style="font-size:.8rem;">{{ s.origin_city }} → {{ s.destination_city }}</td>
                          <td><app-status-badge [status]="s.current_status" /></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Top Clientes -->
              <div class="nx-card">
                <div class="card-header">
                  <h3>Top Clientes</h3>
                </div>
                @for (c of stats.topClientes; track c.name; let i = $index) {
                  <div style="display:flex;align-items:center;gap:1rem;padding:.65rem 0;border-bottom:1px solid var(--border);" [style.border-bottom]="i === stats.topClientes.length - 1 ? 'none' : ''">
                    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0;">{{ i + 1 }}</div>
                    <div style="flex:1;overflow:hidden;">
                      <div style="font-weight:600;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ c.company_name || c.name }}</div>
                    </div>
                    <div style="font-weight:700;color:var(--accent);flex-shrink:0;">{{ c.total_envios }} envíos</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {

  stats: any = null;
  loading = true;
  today   = new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        this.stats   = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
