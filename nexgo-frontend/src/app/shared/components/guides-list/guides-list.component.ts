import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-guides-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-list-container animate-fade-in">
      <!-- Header -->
      <div class="nx-page-header">
        <div class="header-main-row">
          <div>
            <h1>Gestión de Guías</h1>
            <p>Control de inventario y saldos de guías para clientes</p>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem;">
        <div class="search-box" style="flex: 1; height: 45px !important; position: relative;">
          <span class="material-symbols-outlined search-icon" style="position: absolute; top: 50%; transform: translateY(-50%); left: 12px; color: #94a3b8; z-index: 5;">search</span>
          <input type="text" 
                 [(ngModel)]="searchTerm" 
                 (input)="filterUsers()"
                 placeholder="Buscar cliente por nombre o empresa..." 
                 class="nx-input search-input"
                 style="height: 45px !important; width: 100%; padding: 0 15px 0 40px !important; border-radius: 12px !important; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(255,255,255,0.1) !important;">
        </div>
        
        <button (click)="toggleActiveState()" 
                class="nx-btn btn-status-toggle" 
                [class.state-inactive]="activeStateFilter() === 'ACTIVE'"
                [class.state-active]="activeStateFilter() === 'INACTIVE'"
                style="height: 45px !important; padding: 0 25px; border-radius: 12px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; border: none; margin: 0;">
          <span class="material-symbols-outlined" style="font-size: 1.3rem;">
            {{ activeStateFilter() === 'ACTIVE' ? 'person_off' : 'person_check' }}
          </span>
          {{ activeStateFilter() === 'ACTIVE' ? 'Ver Inactivos' : 'Ver Activos' }}
        </button>
      </div>

      <!-- KPI Grid -->
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
                <th style="text-align: center;">GUÍAS DISPONIBLES</th>
                <th style="text-align: center;">ESTADO</th>
                <th class="actions-column" style="text-align: center !important;">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers; track user.id; let i = $index) {
                <tr [style.opacity]="user.is_active ? 1 : 0.6">
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
                  <td style="text-align: center;">
                    <div [style.color]="(user.pricing?.available_guides || 0) <= 5 ? '#F87171' : '#34D399'" style="font-weight: 800; font-size: 1.3rem; letter-spacing: 1px;">
                      {{ user.pricing?.available_guides || 0 }}
                    </div>
                  </td>
                  <td style="text-align: center;">
                    @if ((user.pricing?.available_guides || 0) > 0) {
                      <span class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">Con Saldo</span>
                    } @else {
                      <span class="status-badge" style="background: rgba(244, 63, 94, 0.1); color: #f43f5e;">Agotadas</span>
                    }
                  </td>
                  <td class="actions-column">
                    <div class="dropdown-container" style="position:relative; display:inline-block;">
                      <button (click)="toggleDropdown(user.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                      <div class="dropdown-menu animate-scale-up" 
                           [class.dropup]="i >= filteredUsers.length - 2 && filteredUsers.length > 3"
                           [style.display]="openDropdownId === user.id ? 'block' : 'none'">
                        
                        <button (click)="openInventoryManager(user)" class="dropdown-item" style="color: #6366f1;">
                          <span class="material-symbols-outlined">add_circle</span> Añadir Guías
                        </button>
                        
                        <button (click)="viewRobustHistory(user)" class="dropdown-item">
                          <span class="material-symbols-outlined">history_edu</span> Ver Bitácora
                        </button>
                      </div>
                    </div>
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
    .nx-kpi-card { cursor: pointer; transition: all 0.3s; padding: 1.5rem !important; border: 1px solid rgba(255,255,255,0.05); }
    .nx-kpi-card:hover { transform: translateY(-5px); border-color: rgba(99, 102, 241, 0.3); }
    .nx-kpi-card.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
    .kpi-bg-icon {
      position: absolute; right: -15px; bottom: -15px;
      font-size: 5.5rem !important; color: #94a3b8; opacity: 0.12;
      transform: rotate(-10deg); pointer-events: none;
    }
    .nx-table tr:hover { background: rgba(255,255,255,0.02); }
    .nx-table th { 
      font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; 
      text-align: center !important; padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); 
    }
    .nx-table td { color: #e2e8f0; font-size: 0.9rem; padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.02); }
    
    .nx-table-wrap { 
      position: relative; overflow: auto; height: 600px; 
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .nx-table-wrap::after {
      content: ''; position: absolute; top: 0; bottom: 0; right: 236px;
      width: 1px; background: rgba(255, 255, 255, 0.1); pointer-events: none; z-index: 10;
    }
    .actions-column { width: 236px; text-align: left !important; padding-left: 8px !important; }

    .user-avatar-small { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .btn-status-toggle { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
    .btn-status-toggle.state-active { background: #10b981 !important; }
    .btn-status-toggle.state-inactive { background: #f43f5e !important; }

    /* Dropdown CSS Parity */
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
export class GuidesListComponent implements OnInit {
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  pricingRules: any[] = [];
  searchTerm = '';
  activeFilter = signal<'ALL' | 'SMALL_CUSTOMER' | 'AVERAGE_CUSTOMER' | 'FULL_CUSTOMER'>('ALL');
  activeStateFilter = signal<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  openDropdownId: string | null = null;
  
  tierStats = [
    { name: 'SMALL_CUSTOMER', label: 'Bronce', count: 0 },
    { name: 'AVERAGE_CUSTOMER', label: 'Plata', count: 0 },
    { name: 'FULL_CUSTOMER', label: 'Oro', count: 0 }
  ];

  constructor(private adminService: AdminService) {}

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
          const pricing = this.pricingRules.find(r => r.user_id === user.id) || 
                        this.pricingRules.find(r => (r.role_id === user.role_id || r.role_id === user.roleId) && !r.user_id);
          return { ...user, pricing };
        });

        this.updateStats();
        this.filterUsers();
      }
    });
  }

  updateStats() {
    this.tierStats.forEach(stat => {
      stat.count = this.allUsers.filter(u => u.role === stat.name && u.is_active === (this.activeStateFilter() === 'ACTIVE')).length;
    });
  }

  filterUsers() {
    const isSearching = this.searchTerm.length > 0;
    this.filteredUsers = this.allUsers.filter(u => {
      const matchesSearch = (u.name + (u.company_name || '') + u.username).toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.activeFilter() === 'ALL' || u.role === this.activeFilter();
      const matchesState = isSearching || (this.activeStateFilter() === 'ACTIVE' ? u.is_active : !u.is_active);
      return matchesSearch && matchesRole && matchesState;
    });
  }

  toggleActiveState() {
    this.activeStateFilter.set(this.activeStateFilter() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    this.updateStats();
    this.filterUsers();
  }

  setFilter(filter: any) {
    this.activeFilter.set(this.activeFilter() === filter ? 'ALL' : filter);
    this.filterUsers();
  }

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  async openInventoryManager(user: any) {
    this.openDropdownId = null;
    const pricingId = user.pricing?.id;
    if (!pricingId) {
      Swal.fire({ icon: 'warning', title: 'Sin Tarifa', text: 'El cliente debe tener una tarifa asignada.', background: '#1e293b', color: '#fff' });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Cargar Inventario de Guías',
      background: '#1e293b',
      color: '#fff',
      html: `
        <div style="text-align:center; margin-bottom:20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2);">
          <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:5px;">Cliente: <b style="color:#fff;">${user.company_name || user.name}</b></div>
          <div style="font-size:1.1rem; color:#fff;">Saldo Actual: <b style="color:#10b981;">${user.pricing.available_guides || 0} guías</b></div>
        </div>
        <div class="nx-form-group" style="text-align:left;">
          <label style="display:block; margin-bottom:8px; font-size:12px; font-weight:700; color:#6366f1;">CANTIDAD A AÑADIR</label>
          <input id="swal-amount" type="number" class="nx-input" style="width:100%" placeholder="Ej. 100">
          <label style="display:block; margin-top:15px; margin-bottom:8px; font-size:12px; font-weight:700; color:#6366f1;">MOTIVO / REFERENCIA</label>
          <textarea id="swal-reason" class="nx-input" style="width:100%; height:80px;" placeholder="Ej. Pago realizado via transferencia..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Carga',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        return {
          amount: (document.getElementById('swal-amount') as HTMLInputElement).value,
          reason: (document.getElementById('swal-reason') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues && formValues.amount) {
      this.adminService.addGuides(pricingId, parseInt(formValues.amount), formValues.reason).subscribe(() => {
        Swal.fire({ icon: 'success', title: '¡Carga Exitosa!', text: `Se sumaron ${formValues.amount} guías.`, background: '#1e293b', color: '#fff', timer: 2000 });
        this.loadData();
      });
    }
  }

  viewRobustHistory(user: any) {
    const pricingId = user.pricing?.id;
    if (!pricingId) return;

    Swal.fire({ title: 'Cargando bitácora...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#1e293b', color: '#fff' });

    this.adminService.getInventoryLogs(pricingId).subscribe({
      next: (res: any) => {
        const logs = res.data || [];
        let logsHtml = '<div style="max-height:500px; overflow-y:auto; text-align:left; padding:10px; scrollbar-width:thin;">';
        
        if (logs.length === 0) {
          logsHtml += '<div style="text-align:center; padding:40px; color:#94a3b8;">No hay movimientos registrados.</div>';
        } else {
          logs.forEach((l: any) => {
            const date = new Date(l.created_at).toLocaleString('es-GT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            logsHtml += `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 12px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                  <div style="font-size: 0.75rem; color: #818cf8; font-weight: 700;">${date}</div>
                  <div style="background: #10b98120; color: #10b981; font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 800;">INGRESO</div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center;">
                  <div style="text-align: center; min-width: 60px;">
                    <div style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase;">Añadido</div>
                    <div style="font-size: 1.2rem; font-weight: 900; color: #10b981;">+${l.added_amount}</div>
                  </div>
                  <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.1);"></div>
                  <div>
                    <div style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase;">Gestionado por</div>
                    <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">${l.admin_name}</div>
                  </div>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: #cbd5e1; font-style: italic;">
                  "${l.reason || 'Sin comentario detallado'}"
                </div>
                <div style="margin-top: 5px; text-align: right; font-size: 0.75rem; color: #94a3b8;">
                  Balance Resultante: <b>${l.new_balance}</b>
                </div>
              </div>
            `;
          });
        }
        logsHtml += '</div>';

        Swal.fire({
          title: `<div style="text-align:left; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Bitácora de Guías: ${user.company_name || user.name}</div>`,
          html: logsHtml,
          width: '500px',
          background: '#1e293b',
          color: '#fff',
          confirmButtonText: 'Cerrar Bitácora',
          confirmButtonColor: '#6366f1'
        });
      }
    });
  }

  getRoleLabel(role: string) { return { SMALL_CUSTOMER: 'Bronce', AVERAGE_CUSTOMER: 'Plata', FULL_CUSTOMER: 'Oro' }[role] || role; }
  getRoleColor(role: string) { return { SMALL_CUSTOMER: '#cd7f32', AVERAGE_CUSTOMER: '#94a3b8', FULL_CUSTOMER: '#f59e0b' }[role] || '#6366f1'; }
  getRoleIcon(role: string) { return { ALL: 'group', SMALL_CUSTOMER: 'social_leaderboard', AVERAGE_CUSTOMER: 'military_tech', FULL_CUSTOMER: 'workspace_premium' }[role] || 'person'; }
}
