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
                        
                        <button (click)="viewRobustHistory(user, $event)" class="dropdown-item">
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

      <!-- Modal de Bitácora Nativo (Angular) -->
      @if (showHistoryModal) {
        <div class="history-modal-backdrop" (click)="closeHistoryModal()">
          <div class="history-modal animate-scale-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="material-symbols-outlined" style="color:var(--primary);">history_edu</span>
                <h3 style="margin:0; font-size:1.1rem;">Bitácora de Guías: {{ selectedUserForHistory?.company_name || selectedUserForHistory?.name }}</h3>
              </div>
              <button class="close-btn" (click)="closeHistoryModal()">✕</button>
            </div>
            
            <div class="modal-body" style="max-height: 60vh; overflow-y: auto; padding: 20px;">
              @if (historyLoading) {
                <div style="text-align:center; padding:40px;">
                  <div class="loading-spinner"></div>
                  <p style="color:#94a3b8; margin-top:10px;">Cargando historial...</p>
                </div>
              } @else if (historyLogs.length === 0) {
                <div style="text-align:center; padding:40px; color:#94a3b8;">
                  <span class="material-symbols-outlined" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:10px;">inventory_2</span>
                  No hay movimientos registrados para este cliente.
                </div>
              } @else {
                @for (log of historyLogs; track log.id) {
                  <div class="log-entry" [style.border-left]="(log.added_amount >= 0 ? '4px solid #10b981' : '4px solid #f43f5e')">
                    <div class="log-header">
                      <span class="log-date">{{ log.created_at | date:'dd MMM yyyy, HH:mm' }}</span>
                      <span class="log-type" [style.background]="(log.added_amount >= 0 ? '#10b98120' : '#f43f5e20')" [style.color]="(log.added_amount >= 0 ? '#10b981' : '#f43f5e')">
                        {{ log.added_amount >= 0 ? 'INGRESO' : 'REDUCCIÓN' }}
                      </span>
                    </div>
                    <div class="log-content">
                      <div class="log-amount">
                        <small>{{ log.added_amount >= 0 ? 'Añadido' : 'Quitado' }}</small>
                        <span [style.color]="(log.added_amount >= 0 ? '#10b981' : '#f43f5e')">
                          {{ log.added_amount >= 0 ? '+' : '' }}{{ log.added_amount }}
                        </span>
                      </div>
                      <div class="log-divider"></div>
                      <div class="log-info">
                        <small>Gestionado por</small>
                        <strong>{{ log.admin_name || 'Administrador' }}</strong>
                      </div>
                    </div>
                    @if (log.reason) {
                      <div class="log-reason">"{{ log.reason }}"</div>
                    }
                    <div class="log-footer">
                      Balance anterior: {{ log.previous_balance }} ➔ Nuevo balance: <strong>{{ log.new_balance }}</strong>
                    </div>
                  </div>
                }
              }
            </div>
            
            <div class="modal-footer" style="padding: 15px 20px; background: rgba(0,0,0,0.2); text-align:right;">
              <button class="nx-btn btn-primary" (click)="closeHistoryModal()" style="padding: 0 25px;">Cerrar</button>
            </div>
          </div>
        </div>
      }
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

    /* Modal Styles */
    .history-modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
    }
    .history-modal {
      background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; width: 90%; max-width: 500px; overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem; }
    
    .log-entry { 
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); 
      border-radius: 12px; padding: 15px; margin-bottom: 12px; 
    }
    .log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .log-date { font-size: 0.75rem; color: #818cf8; font-weight: 700; }
    .log-type { background: #10b98120; color: #10b981; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
    .log-content { display: flex; gap: 15px; align-items: center; }
    .log-amount { display: flex; flex-direction: column; min-width: 60px; }
    .log-amount small { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; }
    .log-amount span { font-size: 1.1rem; font-weight: 800; }
    .log-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }
    .log-info small { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; display: block; }
    .log-reason { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; color: #cbd5e1; font-style: italic; }
    .log-footer { margin-top: 5px; text-align: right; font-size: 0.7rem; color: #94a3b8; }

    .loading-spinner {
      width: 40px; height: 40px; border: 3px solid rgba(99, 102, 241, 0.1);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 1s linear infinite; margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

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

  // Bitácora Local Modal
  showHistoryModal = false;
  historyLogs: any[] = [];
  historyLoading = false;
  selectedUserForHistory: any = null;

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
          const pricing = this.pricingRules.find(r => r.user_id == user.id) || 
                        this.pricingRules.find(r => (r.role_id == user.role_id || r.role_id == user.roleId) && !r.user_id);
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

  viewRobustHistory(user: any, event: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.openDropdownId = null;
    const pricingId = user.pricing?.id;
    
    if (!pricingId) {
      Swal.fire({ icon: 'warning', title: 'Sin Tarifa', text: 'Este cliente no tiene una tarifa asignada.', background: '#1e293b', color: '#fff' });
      return;
    }

    this.selectedUserForHistory = user;
    this.showHistoryModal = true;
    this.historyLoading = true;
    this.historyLogs = [];

    // Forzamos la limpieza de caché en la petición
    this.adminService.getInventoryLogs(pricingId).subscribe({
      next: (res: any) => {
        this.historyLoading = false;
        if (res && res.success) {
          // Ordenamos por fecha de forma descendente por seguridad
          this.historyLogs = (res.data || []).sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          this.historyLogs = [];
          console.warn('Bitácora vacía para ID:', pricingId);
        }
      },
      error: (err) => {
        this.historyLoading = false;
        console.error('Error al cargar bitácora:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los movimientos.', background: '#1e293b', color: '#fff' });
      }
    });
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
  }

  getRoleLabel(role: string) { return { SMALL_CUSTOMER: 'Bronce', AVERAGE_CUSTOMER: 'Plata', FULL_CUSTOMER: 'Oro' }[role] || role; }
  getRoleColor(role: string) { return { SMALL_CUSTOMER: '#cd7f32', AVERAGE_CUSTOMER: '#94a3b8', FULL_CUSTOMER: '#f59e0b' }[role] || '#6366f1'; }
  getRoleIcon(role: string) { return { ALL: 'group', SMALL_CUSTOMER: 'social_leaderboard', AVERAGE_CUSTOMER: 'military_tech', FULL_CUSTOMER: 'workspace_premium' }[role] || 'person'; }
}
