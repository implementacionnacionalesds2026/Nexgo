import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { AdminService }        from '../../../core/services/admin.service';
import { ShipmentService }     from '../../../core/services/shipment.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-envios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">📦 Gestión de Envíos</span>
        </div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Envíos</h1>
            <p>Monitoreo y gestión de todos los envíos registrados</p>
            <div class="header-actions">
              <select class="nx-input" style="width:180px;" [(ngModel)]="statusFilter" (change)="load()">
                <option value="">Todos los estados</option>
                @for (s of statuses; track s) { <option [value]="s">{{ statusLabel(s) }}</option> }
              </select>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead><tr>
                    <th>Guía</th><th>Cliente</th><th>Origen</th><th>Destino</th>
                    <th>Peso</th><th>Costo</th><th>Estado</th><th>Acciones</th>
                  </tr></thead>
                  <tbody>
                    @for (s of shipments; track s.id) {
                      <tr>
                        <td class="font-mono" style="font-size:.78rem;color:var(--accent);">{{ s.tracking_number }}</td>
                        <td style="font-size:.83rem;">{{ s.company_name || s.client_name }}</td>
                        <td style="font-size:.83rem;">{{ s.origin_city }}</td>
                        <td style="font-size:.83rem;">{{ s.destination_city }}</td>
                        <td style="font-size:.83rem;">{{ s.weight_kg }} kg</td>
                        <td style="font-size:.83rem;">Q{{ s.estimated_cost | number:'1.2-2' }}</td>
                        <td><app-status-badge [status]="s.current_status" /></td>
                        <td>
                          <button class="nx-btn btn-ghost btn-sm" (click)="viewDetail(s)">Ver →</button>
                        </td>
                      </tr>
                    }
                    @if (shipments.length === 0) {
                      <tr><td colspan="8"><div class="nx-empty"><div class="empty-icon">📦</div><h3>Sin envíos</h3></div></td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Paginación -->
            <div class="nx-pagination">
              <button [disabled]="page <= 1" (click)="changePage(-1)">‹</button>
              <button class="active">{{ page }}</button>
              <button [disabled]="shipments.length < 20" (click)="changePage(1)">›</button>
            </div>
          }
        </div>
      </main>
    </div>

    <!-- Detalle Modal -->
    @if (selected) {
      <div class="nx-modal-backdrop" (click)="selected=null">
        <div class="nx-modal" style="max-width:620px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Envío {{ selected.tracking_number }}</h3>
            <button class="close-btn" (click)="selected=null">✕</button>
          </div>
          <div class="modal-body">
            <div class="nx-form-row cols-2">
              <div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.25rem;">REMITENTE</div>
                <div style="font-weight:600;">{{ selected.sender_name }}</div>
                <div style="font-size:.83rem;color:var(--text-muted);">{{ selected.origin_city }}</div>
              </div>
              <div>
                <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.25rem;">DESTINATARIO</div>
                <div style="font-weight:600;">{{ selected.recipient_name }}</div>
                <div style="font-size:.83rem;color:var(--text-muted);">{{ selected.destination_city }}</div>
              </div>
            </div>
            <hr class="divider">
            <div class="nx-form-row cols-3">
              <div><div class="text-muted" style="font-size:.75rem;">PESO</div><div style="font-weight:600;">{{ selected.weight_kg }} kg</div></div>
              <div><div class="text-muted" style="font-size:.75rem;">DISTANCIA</div><div style="font-weight:600;">{{ selected.distance_km }} km</div></div>
              <div><div class="text-muted" style="font-size:.75rem;">COSTO</div><div style="font-weight:600;color:var(--accent);">Q{{ selected.estimated_cost }}</div></div>
            </div>
            <hr class="divider">
            <!-- Cambio de estado -->
            <div class="nx-form-group">
              <label>Cambiar estado</label>
              <div style="display:flex;gap:.75rem;">
                <select class="nx-input" [(ngModel)]="newStatus">
                  @for (s of statuses; track s) { <option [value]="s">{{ statusLabel(s) }}</option> }
                </select>
                <button class="nx-btn btn-primary" (click)="updateStatus()">Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class EnviosAdminComponent implements OnInit {

  shipments:   any[]   = [];
  loading      = true;
  statusFilter = '';
  page         = 1;
  selected: any = null;
  newStatus    = '';

  statuses = ['PENDIENTE','RECOGIDO','EN_TRANSITO','EN_DESTINO','ENTREGADO','CANCELADO'];

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.shipmentService.getShipments({ status: this.statusFilter, page: this.page }).subscribe({
      next: (r) => { this.shipments = r.data.data; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  viewDetail(s: any) { this.selected = s; this.newStatus = s.current_status; }

  updateStatus() {
    if (!this.selected) return;
    this.shipmentService.updateStatus(this.selected.id, this.newStatus).subscribe({
      next: () => { this.selected = null; this.load(); },
    });
  }

  changePage(d: number) { this.page += d; this.load(); }

  statusLabel(s: string): string {
    const labels: Record<string,string> = {
      PENDIENTE:'Pendiente', RECOGIDO:'Recogido', EN_TRANSITO:'En tránsito',
      EN_DESTINO:'En destino', ENTREGADO:'Entregado', CANCELADO:'Cancelado',
    };
    return labels[s] || s;
  }
}
