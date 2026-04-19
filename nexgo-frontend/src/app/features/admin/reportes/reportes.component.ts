import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { AdminService }        from '../../../core/services/admin.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar"><span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">monitoring</span> Reportes</span></div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Reportes de Envíos</h1>
            <p>Consulta y exportación de datos de envíos filtrados por fecha y estado</p>
          </div>

          <!-- Filtros -->
          <div class="nx-card" style="margin-bottom:1.5rem;">
            <h3 style="margin-bottom:1rem;">Filtros</h3>
            <div class="nx-form-row cols-4">
              <div class="nx-form-group" style="margin-bottom:0;">
                <label>Desde</label>
                <input class="nx-input" type="date" [(ngModel)]="filters.from" />
              </div>
              <div class="nx-form-group" style="margin-bottom:0;">
                <label>Hasta</label>
                <input class="nx-input" type="date" [(ngModel)]="filters.to" />
              </div>
              <div class="nx-form-group" style="margin-bottom:0;">
                <label>Estado</label>
                <select class="nx-input" [(ngModel)]="filters.status">
                  <option value="">Todos</option>
                  @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </div>
              <div class="nx-form-group" style="margin-bottom:0;display:flex;align-items:flex-end;">
                <button class="nx-btn btn-primary btn-block" (click)="load()"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">search</span> Buscar</button>
              </div>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <div class="nx-card" style="padding:0;">
              <div style="padding:1rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:.875rem;color:var(--text-muted);">{{ shipments.length }} resultados</span>
                <button class="nx-btn btn-ghost btn-sm" (click)="exportCsv()">📥 Exportar CSV</button>
              </div>
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead><tr>
                    <th>Guía</th><th>Fecha</th><th>Cliente</th><th>Origen</th><th>Destino</th>
                    <th>Peso</th><th>Distancia</th><th>Costo</th><th>Estado</th><th>Repartidor</th>
                  </tr></thead>
                  <tbody>
                    @for (s of shipments; track s.tracking_number) {
                      <tr>
                        <td class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</td>
                        <td style="font-size:.8rem;">{{ s.created_at | date:'dd/MM/yyyy' }}</td>
                        <td style="font-size:.83rem;">{{ s.company_name || s.cliente }}</td>
                        <td style="font-size:.83rem;">{{ s.origin_city }}</td>
                        <td style="font-size:.83rem;">{{ s.destination_city }}</td>
                        <td style="font-size:.83rem;">{{ s.weight_kg }} kg</td>
                        <td style="font-size:.83rem;">{{ s.distance_km }} km</td>
                        <td style="font-size:.83rem;color:var(--accent);">Q{{ s.estimated_cost }}</td>
                        <td><app-status-badge [status]="s.current_status" /></td>
                        <td style="font-size:.83rem;">{{ s.repartidor || '—' }}</td>
                      </tr>
                    }
                    @if (shipments.length === 0) {
                      <tr><td colspan="10"><div class="nx-empty"><div class="empty-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">dashboard</span></div><h3>Sin datos</h3><p>Ajusta los filtros y busca de nuevo</p></div></td></tr>
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
export class ReportesComponent implements OnInit {

  shipments: any[] = [];
  loading = false;
  statuses = ['PENDIENTE','RECOGIDO','EN_TRANSITO','EN_DESTINO','ENTREGADO','CANCELADO'];
  filters: any = { from: '', to: '', status: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params: any = {};
    if (this.filters.from)   params['from']   = this.filters.from;
    if (this.filters.to)     params['to']     = this.filters.to;
    if (this.filters.status) params['status'] = this.filters.status;

    this.adminService.getShipmentsReport(params).subscribe({
      next: (r) => { this.shipments = r.data.data; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  exportCsv() {
    const headers = ['Guía','Fecha','Cliente','Origen','Destino','Peso','Distancia','Costo','Estado','Repartidor'];
    const rows = this.shipments.map((s) => [
      s.tracking_number, s.created_at?.slice(0,10), s.company_name || s.cliente,
      s.origin_city, s.destination_city, s.weight_kg, s.distance_km, s.estimated_cost, s.current_status, s.repartidor || '',
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nexgo_reporte_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
}
