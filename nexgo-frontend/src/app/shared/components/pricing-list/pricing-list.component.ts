import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pricing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-list-container animate-fade-in">
      <!-- Header -->
      <div class="nx-page-header">
        <div class="header-main-row">
          <div>
            <h1>Gestión de Tarifas</h1>
            <p>Configura costos y pesos personalizados por cliente o empresa</p>
          </div>
        </div>

        <div class="header-actions-row">
        </div>
      </div>

      <!-- Search & Filters -->
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem;">
        <div class="search-box" style="flex: 1; height: 45px !important; position: relative;">
          <span class="material-symbols-outlined search-icon" style="position: absolute; top: 50%; transform: translateY(-50%); left: 12px; color: #94a3b8; z-index: 5;">search</span>
          <input type="text" 
                 [(ngModel)]="searchTerm" 
                 (input)="filterUsers()"
                 placeholder="Buscar por nombre, email, usuario, empresa..." 
                 class="nx-input search-input"
                 style="height: 45px !important; width: 100%; padding: 0 15px 0 40px !important; border-radius: 12px !important; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(255,255,255,0.1) !important; box-sizing: border-box !important;">
        </div>
        
        <!-- Toggle Inactivos Parity -->
        <button (click)="toggleActiveState()" 
                class="nx-btn btn-status-toggle" 
                [class.state-inactive]="activeStateFilter() === 'ACTIVE'"
                [class.state-active]="activeStateFilter() === 'INACTIVE'"
                style="height: 45px !important; padding: 0 25px; border-radius: 12px; font-weight: 700; transition: all 0.3s; color: white; min-width: 140px; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; box-sizing: border-box !important; margin: 0;">
          <span class="material-symbols-outlined" style="font-size: 1.3rem;">
            {{ activeStateFilter() === 'ACTIVE' ? 'person_off' : 'person_check' }}
          </span>
          {{ activeStateFilter() === 'ACTIVE' ? 'Inactivos' : 'Activos' }}
        </button>
      </div>

      <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
        @for (role of tierStats; track role.name) {
          <div class="nx-kpi-card" 
               [class.active]="activeFilter() === role.name" 
               (click)="setFilter(role.name)" 
               style="position:relative; overflow:hidden; min-height: 120px;">
            <div class="kpi-label">{{ role.label | uppercase }}</div>
            <div class="kpi-value" [style.color]="getRoleColor(role.name)">{{ role.count }}</div>
            <span class="material-symbols-outlined kpi-bg-icon" [style.color]="getRoleColor(role.name)">{{ getRoleIcon(role.name) }}</span>
          </div>
        }
      </div>

      <!-- Main Table Card -->
      <div class="nx-card" style="padding:0;">
        <div class="nx-table-wrap">
          <table class="nx-table">
            <thead>
              <tr>
                <th style="text-align: center;">CLIENTE / EMPRESA</th>
                <th style="text-align: center;">NIVEL</th>
                <th style="text-align: center;">COSTO BASE</th>
                <th style="text-align: center;">PESO BASE</th>
                <th style="text-align: center;">EXTRA x LB</th>
                <th style="text-align: center;">TARIFA</th>
                <th class="actions-column" style="text-align: center !important;">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers; track user.id; let i = $index) {
                <tr [class.custom-rate-row]="user.hasCustomRate" [style.opacity]="user.is_active ? 1 : 0.6">
                  <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                       <div class="user-avatar-small" [style.background]="getRoleColor(user.role) + '20'" [style.color]="getRoleColor(user.role)">
                        {{ user.name.charAt(0) }}
                      </div>
                      <div style="text-align: left;">
                        <div style="font-weight: 600; color: #e2e8f0;">{{ user.company_name || user.name }}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8;">{{ user.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="color: #e2e8f0; font-family: 'Inter', sans-serif;">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td style="font-weight: 600;">Q{{ user.pricing?.base_price || '-' }}</td>
                  <td style="font-weight: 600;">{{ user.pricing?.base_weight || '-' }} {{ user.pricing?.weight_unit || 'LB' }}</td>
                  <td style="font-weight: 600;">Q{{ user.pricing?.extra_weight_price || '-' }}</td>
                  <td>
                    @if (user.hasCustomRate) {
                      <span class="status-badge pactada">Pactada</span>
                    } @else {
                      <span class="status-badge estandar">Estándar</span>
                    }
                  </td>
                  <td class="actions-column">
                    <div class="dropdown-container" style="position:relative; display:inline-block;">
                      <button (click)="toggleDropdown(user.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                      <div class="dropdown-menu animate-scale-up" 
                           [class.dropup]="i >= filteredUsers.length - 2 && filteredUsers.length > 3"
                           [style.display]="openDropdownId === user.id ? 'block' : 'none'">
                        
                        @if (user.is_active) {
                          <button (click)="openPricingEditor(user)" class="dropdown-item">
                            <span class="material-symbols-outlined">edit_note</span> Personalizar Tarifa
                          </button>
                          @if (user.hasCustomRate) {
                            <button (click)="resetToDefault(user)" class="dropdown-item" style="color: #F87171;">
                              <span class="material-symbols-outlined">restart_alt</span> Restaurar Estándar
                            </button>
                          }
                          <button (click)="toggleUserStatus(user)" class="dropdown-item" style="color: #f43f5e;">
                            <span class="material-symbols-outlined">person_off</span> Inactivar Cliente
                          </button>
                        } @else {
                          <button (click)="toggleUserStatus(user)" class="dropdown-item" style="color: #10b981;">
                            <span class="material-symbols-outlined">person_check</span> Activar Cliente
                          </button>
                        }

                        <button (click)="viewHistory(user, $event)" class="dropdown-item">
                          <span class="material-symbols-outlined">history</span> Ver Historial
                        </button>

                      </div>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredUsers.length === 0) {
                <tr>
                  <td colspan="7" style="text-align: center; padding: 4rem 2rem; color: #94a3b8;">
                    <span class="material-symbols-outlined" style="font-size: 3rem; opacity: 0.2; display: block; margin-bottom: 1rem;">search_off</span>
                    No se encontraron clientes para mostrar.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-list-container { padding: 1rem 0; }
    
    /* Header Styles parity */
    .search-box { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); }
    .search-input { padding-left: 40px !important; height: 45px; background: rgba(0,0,0,0.4) !important; border-radius: 12px !important; }

    /* KPI Parity */
    .nx-kpi-card { cursor: pointer; transition: all 0.3s; padding: 1.5rem !important; }
    .nx-kpi-card:hover { transform: translateY(-5px); }
    .nx-kpi-card.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
    .nx-kpi-card.mini { border: 1px solid rgba(255,255,255,0.05); }
    .kpi-value.small { font-size: 1.5rem; line-height: 1; margin-top: 5px; }
    .kpi-bg-icon {
      position: absolute; right: -15px; bottom: -15px;
      font-size: 5.5rem !important; color: #94a3b8; opacity: 0.12;
      transform: rotate(-10deg); pointer-events: none;
    }
    .nx-kpi-card.mini .kpi-bg-icon { font-size: 3rem !important; right: -5px; bottom: -5px; }

    .nx-table tr:hover { background: rgba(255,255,255,0.02); transition: background 0.2s; }

    /* Status Toggle Button Parity */
    .btn-status-toggle {
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .btn-status-toggle.state-active {
      background: #10b981 !important;
    }
    .btn-status-toggle.state-inactive {
      background: #f43f5e !important;
    }
    .btn-status-toggle:hover {
      opacity: 0.95;
    }

    /* Table Parity */
    .nx-table { font-family: 'Inter', sans-serif !important; border-collapse: separate; border-spacing: 0; width: 100%; }
    .nx-table th { 
      font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; 
      text-align: center !important; padding: 12px; 
      border-bottom: 1px solid rgba(255,255,255,0.05); 
    }
    .nx-table td { color: #e2e8f0; font-size: 0.9rem; padding: 10px 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.02); }
    .nx-table-wrap { 
      position: relative; overflow: auto; height: 500px; 
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .nx-table-wrap::after {
      content: ''; position: absolute; top: 0; bottom: 0; right: 250px;
      width: 1px; background: rgba(255, 255, 255, 0.1); pointer-events: none; z-index: 10;
    }
    .actions-column { width: 250px; text-align: left !important; padding-left: 10px !important; }

    .user-avatar-small {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem;
    }

    .status-badge {
      padding: 3px 8px; border-radius: 6px;
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
    }
    .status-badge.pactada { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .status-badge.estandar { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

    .custom-rate-row { background: rgba(99, 102, 241, 0.03); }

    /* Dropdown Parity */
    .dropdown-container .dropdown-menu {
      position: absolute; left: calc(100% + 10px); top: -10px; z-index: 500;
      background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3); min-width: 180px; backdrop-filter: blur(8px);
    }
    .dropdown-container .dropdown-menu.dropup { top: auto; bottom: -10px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px;
      color: rgba(255, 255, 255, 0.8); cursor: pointer; border: none; background: none;
      font-size: 13px; transition: all 0.2s; text-align: left;
    }
    .dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--primary); }

    .animate-scale-up { animation: scaleUp 0.2s ease-out; }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class PricingListComponent implements OnInit {

  allUsers: any[] = [];
  filteredUsers: any[] = [];
  pricingRules: any[] = [];

  searchTerm = '';
  activeFilter = signal<'ALL' | 'SMALL_CUSTOMER' | 'AVERAGE_CUSTOMER' | 'FULL_CUSTOMER'>('ALL');
  activeStateFilter = signal<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  openDropdownId: string | null = null;

  activeCount = 0;
  inactiveCount = 0;

  tierStats = [
    { name: 'SMALL_CUSTOMER', label: 'Bronce', count: 0 },
    { name: 'AVERAGE_CUSTOMER', label: 'Plata', count: 0 },
    { name: 'FULL_CUSTOMER', label: 'Oro', count: 0 }
  ];

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.loadData();
    document.addEventListener('click', () => this.openDropdownId = null);
  }

  loadData() {
    this.adminService.getPricingRules().subscribe(res => {
      if (res.success) {
        this.pricingRules = res.data;
        this.loadUsers();
      }
    });
  }

  loadUsers() {
    this.adminService.getUsers({ limit: 1000 }).subscribe(res => {
      if (res.success) {
        const clientRoles = ['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER'];
        const users = res.data.data.filter((u: any) => clientRoles.includes(u.role));

        this.allUsers = users.map((user: any) => {
          let pricing = this.pricingRules.find(r => r.user_id === user.id);
          const hasCustomRate = !!pricing;
          if (!pricing) {
            pricing = this.pricingRules.find(r => (r.role_id === user.role_id || r.role_id === user.roleId) && !r.user_id);
          }
          return { ...user, pricing, hasCustomRate };
        });

        this.updateStats();
        this.filterUsers();
      }
    });
  }

  updateStats() {
    this.activeCount = this.allUsers.filter(u => u.is_active).length;
    this.inactiveCount = this.allUsers.filter(u => !u.is_active).length;

    this.tierStats[0].count = this.allUsers.filter(u => u.role === 'SMALL_CUSTOMER' && u.is_active === (this.activeStateFilter() === 'ACTIVE')).length;
    this.tierStats[1].count = this.allUsers.filter(u => u.role === 'AVERAGE_CUSTOMER' && u.is_active === (this.activeStateFilter() === 'ACTIVE')).length;
    this.tierStats[2].count = this.allUsers.filter(u => u.role === 'FULL_CUSTOMER' && u.is_active === (this.activeStateFilter() === 'ACTIVE')).length;
  }

  filterUsers() {
    const isSearching = this.searchTerm.length > 0;

    this.filteredUsers = this.allUsers.filter(u => {
      const matchesSearch = (u.name + (u.company_name || '') + u.username).toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.activeFilter() === 'ALL' || u.role === this.activeFilter();

      // Si está buscando, ignoramos el filtro de Activo/Inactivo para encontrarlo en cualquier estado
      const matchesState = isSearching || (this.activeStateFilter() === 'ACTIVE' ? u.is_active : !u.is_active);

      return matchesSearch && matchesRole && matchesState;
    });
  }

  toggleActiveState() {
    const newState = this.activeStateFilter() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.activeStateFilter.set(newState);
    this.activeFilter.set('ALL');
    this.updateStats();
    this.filterUsers();
  }

  setFilter(filter: any) {
    if (this.activeFilter() === filter) {
      this.activeFilter.set('ALL');
    } else {
      this.activeFilter.set(filter);
    }
    this.filterUsers();
  }

  toggleUserStatus(user: any) {
    const action = user.is_active ? 'desactivar' : 'activar';
    const actionColor = user.is_active ? '#f43f5e' : '#10b981';

    Swal.fire({
      title: `¿Deseas ${action} al cliente?`,
      text: `Al ${action} a ${user.company_name || user.name}, ${user.is_active ? 'no podrá realizar nuevos envíos' : 'recuperará el acceso al sistema'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: actionColor,
      cancelButtonColor: '#334155',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateUser(user.id, { isActive: !user.is_active } as any).subscribe(() => {
          this.showSuccess(`Cliente ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
          this.loadData();
        });
      }
    });
  }

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  async openPricingEditor(user: any) {
    this.openDropdownId = null;
    const currentPricing = user.pricing || {};

    const { value: formValues } = await Swal.fire({
      title: `Tarifa Personalizada: ${user.company_name || user.name}`,
      background: '#1e293b',
      color: '#ffffff',
      html: `
        <div class="swal-pricing-form" style="text-align:left; padding-top:1rem;">
          <div class="nx-form-group" style="margin-bottom:1.25rem;">
            <label style="display:block; margin-bottom:0.5rem; font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">Costo por Guía (Q)</label>
            <input id="swal-base-price" type="number" class="nx-input" value="${currentPricing.base_price || 0}" style="width:100%">
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div class="nx-form-group">
              <label style="display:block; margin-bottom:0.5rem; font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">Peso Base (LB)</label>
              <input id="swal-base-weight" type="number" class="nx-input" value="${currentPricing.base_weight || 0}" style="width:100%">
            </div>
            <div class="nx-form-group">
              <label style="display:block; margin-bottom:0.5rem; font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">Extra x LB (Q)</label>
              <input id="swal-extra-price" type="number" class="nx-input" value="${currentPricing.extra_weight_price || 0}" style="width:100%">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Tarifa Especial',
      confirmButtonColor: '#6366f1',
      preConfirm: () => {
        return {
          base_price: (document.getElementById('swal-base-price') as HTMLInputElement).value,
          base_weight: (document.getElementById('swal-base-weight') as HTMLInputElement).value,
          extra_weight_price: (document.getElementById('swal-extra-price') as HTMLInputElement).value,
          name: `Tarifa Especial: ${user.company_name || user.name}`,
          user_id: user.id,
          role_id: user.role_id,
          weight_unit: 'LB',
          isActive: true
        }
      }
    });

    if (formValues) {
      if (user.hasCustomRate && user.pricing?.id) {
        this.adminService.updatePricingRule(user.pricing.id, formValues as any).subscribe(() => {
          this.showSuccess('Tarifa actualizada correctamente');
          this.loadData();
        });
      } else {
        this.adminService.createPricingRule(formValues as any).subscribe(() => {
          this.showSuccess('Nueva tarifa especial creada');
          this.loadData();
        });
      }
    }
  }

  viewHistory(user: any, event: Event) {
    event.stopPropagation();
    const pricingId = user.pricing?.id;
    this.openDropdownId = null;

    if (!pricingId) {
      Swal.fire({
        icon: 'info',
        title: 'Sin Historial',
        text: 'Esta tarifa aún no tiene un registro de cambios.',
        background: '#1e293b',
        color: '#fff'
      });
      return;
    }

    // Notificación de carga elegante
    const loadingToast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      background: '#1e293b',
      color: '#fff',
      timer: 2000
    });

    loadingToast.fire({
      icon: 'info',
      title: 'Consultando historial...'
    });

    this.adminService.getPricingHistory(pricingId).subscribe({
      next: (res: any) => {
        if (res.success) {
          const history = res.data || [];
          let historyHtml = '<div class="history-timeline" style="max-height:450px; overflow-y:auto; text-align:left; padding:10px; scrollbar-width:thin;">';

          if (history.length === 0) {
            historyHtml += `
              <div style="text-align:center; padding:30px; color:#94a3b8;">
                <span class="material-symbols-outlined" style="font-size:3rem; opacity:0.2; display:block; margin-bottom:1rem;">history_toggle_off</span>
                No hay cambios registrados aún.
              </div>
            `;
          } else {
            history.forEach((h: any) => {
              // Aseguramos que el objeto Date entienda que la fecha viene en UTC si tiene el sufijo Z
              const dateObj = new Date(h.created_at);
              const date = dateObj.toLocaleString('es-GT', {
                timeZone: 'America/Guatemala',
                hour12: true,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              historyHtml += `
                <div style="border-left:2px solid #6366f1; padding-left:15px; margin-bottom:20px; position:relative;">
                  <div style="position:absolute; left:-7px; top:0; width:12px; height:12px; border-radius:50%; background:#6366f1; border:2px solid #1e293b;"></div>
                  <div style="font-size:0.7rem; color:#818cf8; font-weight:800; text-transform:uppercase; margin-bottom:4px;">${date}</div>
                  <div style="font-weight:700; color:#f8fafc; font-size:0.95rem; margin-bottom:6px;">
                    <span class="material-symbols-outlined" style="font-size:0.9rem; vertical-align:middle; margin-right:4px;">person</span>
                    ${h.admin_name || 'Sistema'}
                  </div>
                  <div style="font-size:0.85rem; color:#cbd5e1; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                    ${this.formatHistoryDiff(h.old_values, h.new_values)}
                  </div>
                </div>
              `;
            });
          }

          historyHtml += '</div>';

          Swal.close();

          setTimeout(() => {
            Swal.fire({
              title: `<div style="text-align:left; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px; font-size:1.2rem;">Historial de Modificaciones</div>`,
              html: historyHtml,
              width: '550px',
              background: '#1e293b',
              color: '#fff',
              confirmButtonText: 'Cerrar ventana',
              confirmButtonColor: '#6366f1',
              showClass: { popup: 'animate-scale-up' }
            });
          }, 100);
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error de servidor',
          text: 'No se pudo conectar con el historial en este momento.',
          background: '#1e293b',
          color: '#fff'
        });
      }
    });
  }

  private formatHistoryDiff(oldV: any, newV: any): string {
    if (!oldV) return '<span style="color:#10b981; font-weight:700;"><span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:5px;">magic_button</span> Creación inicial de la tarifa</span>';

    let changes = [];
    if (oldV.base_price != newV.base_price) changes.push(`• <b>Costo:</b> Q${oldV.base_price} → <span style="color:#10b981">Q${newV.base_price}</span>`);
    if (oldV.base_weight != newV.base_weight) changes.push(`• <b>Peso:</b> ${oldV.base_weight}LB → <span style="color:#10b981">${newV.base_weight}LB</span>`);
    if (oldV.extra_weight_price != newV.extra_weight_price) changes.push(`• <b>Extra:</b> Q${oldV.extra_weight_price} → <span style="color:#10b981">Q${newV.extra_weight_price}</span>`);

    return changes.length > 0 ? changes.join('<br>') : '<i style="color:#94a3b8">Actualización de datos generales</i>';
  }

  resetToDefault(user: any) {
    if (!user.pricing?.id || !user.hasCustomRate) return;

    Swal.fire({
      title: '¿Restaurar tarifa estándar?',
      text: `Se eliminarán los costos personalizados para ${user.company_name || user.name} y volverá a usar la tarifa de su nivel.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#F87171',
      background: '#1e293b',
      color: '#fff'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.updatePricingRule(user.pricing.id, { isActive: false } as any).subscribe(() => {
          this.showSuccess('Se ha vuelto a la tarifa estándar');
          this.loadData();
        });
      }
    });
  }

  showSuccess(msg: string) {
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Hecho!',
        text: msg,
        background: '#1e293b',
        color: '#ffffff',
        confirmButtonColor: '#6366f1',
        timer: 2500,
        timerProgressBar: true
      });
    }, 200);
  }

  getRoleLabel(role: string) {
    const labels: any = { SMALL_CUSTOMER: 'Bronce', AVERAGE_CUSTOMER: 'Plata', FULL_CUSTOMER: 'Oro' };
    return labels[role] || role;
  }

  getRoleColor(role: string) {
    const colors: any = { SMALL_CUSTOMER: '#cd7f32', AVERAGE_CUSTOMER: '#94a3b8', FULL_CUSTOMER: '#f59e0b' };
    return colors[role] || '#6366f1';
  }

  getRoleIcon(role: string) {
    const icons: any = { ALL: 'group', SMALL_CUSTOMER: 'social_leaderboard', AVERAGE_CUSTOMER: 'military_tech', FULL_CUSTOMER: 'workspace_premium' };
    return icons[role] || 'person';
  }
}
