import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { User } from '../../../core/models/user.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom;">group</span> 
            Gestión de Usuarios
          </span>
        </div>

        <div class="nx-content">
          <div class="nx-page-header">
            <div class="header-main-row">
              <div>
                <h1>Usuarios del Sistema</h1>
                <p>Administra administradores, repartidores y clientes de Nexgo</p>
              </div>
            </div>

            <div class="header-actions-row">
              <div class="search-box">
                <span class="material-symbols-outlined search-icon">search</span>
                <input 
                  type="text" 
                  [(ngModel)]="searchText" 
                  placeholder="Buscar por nombre, email, usuario, empresa..." 
                  class="nx-input search-input" 
                />
              </div>
              
              <div class="table-tools">
                <div class="options-dropdown-container">
                  <button class="nx-btn btn-options" (click)="toggleOptionsMenu($event)" [class.active]="isOptionsMenuOpen">
                    <span class="material-symbols-outlined">settings</span>
                    Acciones
                    <span class="material-symbols-outlined">{{ isOptionsMenuOpen ? 'expand_less' : 'expand_more' }}</span>
                  </button>

                  @if (isOptionsMenuOpen) {
                    <div class="options-menu animate-scale-up" (click)="$event.stopPropagation()">
                      <button class="options-item" (click)="openCreate()">
                        <span class="material-symbols-outlined">person_add</span>
                        Nuevo Usuario
                      </button>
                      <div class="options-divider"></div>
                      <button class="options-item" (click)="exportToExcel()">
                        <span class="material-symbols-outlined">download</span>
                        Exportar Excel
                      </button>
                      <button class="options-item" (click)="isColumnMenuOpen = !isColumnMenuOpen">
                        <span class="material-symbols-outlined">view_column</span>
                        Gestionar Columnas
                      </button>

                      @if (isColumnMenuOpen) {
                        <div class="columns-nested animate-fade-in" style="padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-top: 4px;">
                          @for (col of columnConfigs; track col.key) {
                            <label class="column-opt" style="display: flex; align-items: center; gap: 10px; padding: 4px 0; color: #94a3b8; font-size: 0.8rem; cursor: pointer;">
                              <input type="checkbox" [(ngModel)]="col.visible" style="accent-color:var(--primary); cursor:pointer;" />
                              <span>{{ col.label }}</span>
                            </label>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Toggle Status Button -->
                <button 
                  class="nx-btn" 
                  [class.btn-active-toggle]="viewActive"
                  [class.btn-inactive-toggle]="!viewActive"
                  (click)="toggleActiveView()"
                >
                  <span class="material-symbols-outlined">{{ viewActive ? 'person_off' : 'how_to_reg' }}</span>
                  {{ viewActive ? 'Inactivos' : 'Activos' }}
                </button>
              </div>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <!-- KPI Grid (Replicating Mis Envíos style) -->
            <div class="nx-grid kpi-grid" style="margin-bottom:1.5rem;">
              @for (role of roles; track role.id) {
                <div class="nx-kpi-card" [class.active]="activeRoleFilter === role.name" (click)="toggleRoleFilter(role.name)" style="position:relative; overflow:hidden;">
                  <div class="kpi-label">{{ (role.description || role.name) | uppercase }}</div>
                  <div class="kpi-value">{{ countByRole(role.name) }}</div>
                  <span class="material-symbols-outlined kpi-bg-icon">{{ getRoleIcon(role.name) }}</span>
                </div>
              }
            </div>

            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead>
                    <tr>
                      @if (isColumnVisible('usuario')) { <th>USUARIO <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      @if (isColumnVisible('nombre')) { <th>NOMBRE <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      @if (isColumnVisible('email')) { <th>EMAIL <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      @if (isColumnVisible('rol')) { <th>ROL <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      @if (isColumnVisible('empresa')) { <th>EMPRESA <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      @if (isColumnVisible('fecha')) { <th>CREADO <span class="material-symbols-outlined header-filter">filter_alt</span></th> }
                      <th class="actions-column">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of filteredUsers; track u.id; let i = $index) {
                      <tr [style.opacity]="u.is_active ? 1 : 0.6">
                        @if (isColumnVisible('usuario')) {
                          <td>
                            <span class="user-id-badge">
                              {{ u.username || u.email.split('@')[0] }}
                            </span>
                          </td>
                        }
                        @if (isColumnVisible('nombre')) {
                          <td style="font-weight: 600;">
                            {{ u.name || (u.first_name + ' ' + u.last_name) }}
                            @if (!u.is_active) { <span class="status-indicator inactive"></span> }
                          </td>
                        }
                        @if (isColumnVisible('email')) { <td class="text-muted">{{ u.email }}</td> }
                        @if (isColumnVisible('rol')) { <td><app-status-badge [status]="u.role" /></td> }
                        @if (isColumnVisible('empresa')) { 
                          <td class="text-muted">
                            {{ (u.role === 'ADMIN' || u.role === 'REPARTIDOR') ? 'Nacionales Delivery Services' : (u.company_name || '—') }}
                          </td> 
                        }
                        @if (isColumnVisible('fecha')) { <td class="text-muted" style="font-size:0.75rem;">{{ u.created_at | date:'dd/MM/yy' }}</td> }
                        <td class="actions-column">
                          <div class="dropdown-container" style="position:relative; display:inline-block;">
                            <button (click)="toggleDropdown(u.id, $event)" class="nx-btn btn-ghost btn-sm" style="font-weight:bold; color:var(--text);">⋮</button>
                             <div class="dropdown-menu" 
                                  [class.dropup]="i === filteredUsers.length - 1 && filteredUsers.length > 1"
                                  [style.display]="openDropdownId === u.id ? 'block' : 'none'">
                               @if (u.is_active) {
                                 <button (click)="openEdit(u)" class="dropdown-item">
                                   <span class="material-symbols-outlined">edit</span> Editar Usuario
                                 </button>
                               }
                               <button (click)="toggleUserStatus(u)" class="dropdown-item" [style.color]="u.is_active ? '#F87171' : '#34D399'">
                                 <span class="material-symbols-outlined">{{ u.is_active ? 'person_off' : 'how_to_reg' }}</span>
                                 {{ u.is_active ? 'Inactivar Usuario' : 'Activar Usuario' }}
                               </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (filteredUsers.length === 0) {
                      <tr>
                        <td [attr.colspan]="visibleColumnsCount + 1">
                          <div class="nx-empty search-empty animate-fade-in">
                            <div class="robot-confused">
                              <span class="material-symbols-outlined robot-icon">smart_toy</span>
                            </div>
                            <h3>No encontré usuarios</h3>
                            <p>Prueba con otros filtros o términos de búsqueda</p>
                            <button class="nx-btn btn-ghost" (click)="clearFilters()" style="margin-top:1rem;">Limpiar filtros</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </main>
    </div>

    <!-- Modal Crear/Editar -->
    @if (showModal) {
      <div class="nx-modal-backdrop" (click)="closeModal()">
        <div class="nx-modal animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editMode ? '✏️ Editar Usuario' : '➕ Nuevo Usuario' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            @if (modalError) { <div class="nx-alert alert-error"><span class="material-symbols-outlined">warning</span> {{ modalError }}</div> }

            <div class="nx-form-row cols-2">
              <div class="nx-form-group">
                <label>Nombre</label>
                <input class="nx-input" [(ngModel)]="form.firstName" placeholder="Nombre" />
              </div>
              <div class="nx-form-group">
                <label>Apellido</label>
                <input class="nx-input" [(ngModel)]="form.lastName" placeholder="Apellido" />
              </div>
            </div>
            <div class="nx-form-row cols-2">
              <div class="nx-form-group">
                <label>Teléfono</label>
                <input class="nx-input" [(ngModel)]="form.phone" placeholder="502XXXXXXXX" />
              </div>
              <div class="nx-form-group">
                <label>Email</label>
                <input class="nx-input" type="email" [(ngModel)]="form.email" [disabled]="editMode" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            @if (!editMode) {
              <div class="nx-form-group">
                <label>Contraseña</label>
                <input class="nx-input" type="password" [(ngModel)]="form.password" placeholder="Mínimo 8 caracteres" />
              </div>
            }
            <div class="nx-form-row cols-2">
              <div class="nx-form-group">
                <label>Rol</label>
                <select class="nx-input" [(ngModel)]="form.roleId" (change)="onRoleChange()">
                  @for (r of roles; track r.id) {
                    <option [value]="r.id">{{ r.description || r.name }}</option>
                  }
                </select>
              </div>
              <div class="nx-form-group">
                <label>Empresa (Solo clientes)</label>
                <input 
                  class="nx-input" 
                  [(ngModel)]="form.companyName" 
                  [disabled]="isInternalRole()" 
                  [placeholder]="isInternalRole() ? 'Nacionales Delivery Services' : 'Nombre de empresa'" 
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="nx-btn btn-ghost" (click)="closeModal()">Cancelar</button>
            <button class="nx-btn btn-primary" (click)="saveUser()" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editMode ? 'Actualizar Usuario' : 'Crear Usuario') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header-actions-row { display: flex; align-items: center; gap: 1.25rem; flex-wrap: nowrap; margin-bottom: 2rem; }
    
    .search-box { flex: 1; min-width: 0; display: flex; align-items: center; position: relative; }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); }
    .search-input { padding-left: 40px !important; height: 45px; background: rgba(0,0,0,0.4) !important; border-radius: 12px !important; }

    .table-tools { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }

    .btn-options { 
      background: #5d1d88ff !important; color: white !important; height: 45px; padding: 0 20px;
      border-radius: 12px !important; display: flex; align-items: center; gap: 10px; font-weight: 700;
    }

    .btn-active-toggle { 
      background: #f43f5e !important; 
      color: white !important; 
      border: none !important; 
      font-weight:700; border-radius: 12px !important; height: 45px; padding: 0 15px; 
    }
    .btn-inactive-toggle { 
      background: #10b981 !important; 
      color: white !important; 
      border: none !important; 
      font-weight:700; border-radius: 12px !important; height: 45px; padding: 0 15px; 
    }
    .btn-active-toggle:hover { background: #e11d48 !important; opacity: 0.9; }
    .btn-inactive-toggle:hover { background: #059669 !important; opacity: 0.9; }

    .nx-kpi-card { cursor: pointer; transition: all 0.3s; padding: 1.5rem !important; }
    .nx-kpi-card:hover { transform: translateY(-5px); }
    .nx-kpi-card.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
    
    .kpi-bg-icon {
      position: absolute; right: -15px; bottom: -15px;
      font-size: 5.5rem !important; color: #94a3b8; opacity: 0.12;
      transform: rotate(-10deg); pointer-events: none;
    }
    .nx-kpi-card.active .kpi-bg-icon { opacity: 0.3; color: var(--primary); }

    .user-id-badge {
      background: rgba(99, 102, 241, 0.1); color: var(--primary);
      padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; font-weight: 700;
    }

    .status-indicator {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 8px;
    }
    .status-indicator.inactive { background: #F87171; box-shadow: 0 0 8px #F87171; }

    .text-muted { color: var(--text-muted); font-size: 0.85rem; }

    /* Dropdown */
    .options-dropdown-container { position: relative; }
    .options-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 130;
      background: #111827; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6); padding: 8px; min-width: 220px; backdrop-filter: blur(20px);
    }
    .options-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 16px;
      color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; border-radius: 8px;
      transition: all 0.2s; border: none; background: none; text-align: left;
    }
    .options-item:hover { background: var(--primary); }
    .options-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 6px 0; }

    .dropdown-container .dropdown-menu {
      position: absolute; left: calc(100% + 10px); top: -10px; z-index: 500;
      background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3); min-width: 180px; backdrop-filter: blur(8px);
    }

    .nx-table-wrap { 
      overflow-x: auto; 
      min-height: 150px; 
      position: relative; 
    }
    .nx-table-wrap::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      right: 250px;
      width: 1px;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 10;
    }
    .dropdown-container .dropdown-menu.dropup { top: auto; bottom: -10px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px;
      color: rgba(255, 255, 255, 0.8); cursor: pointer; border: none; background: none;
      font-size: 13px; transition: all 0.2s; text-align: left;
    }
    .dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--primary); }

    /* Modal */
    .nx-modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .nx-modal {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 20px; width: 100%; max-width: 600px; overflow: hidden;
    }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 1.5rem; max-height: 70vh; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; background: rgba(0,0,0,0.2); display: flex; justify-content: flex-end; gap: 1rem; }
    .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }

    .header-filter { font-size: 14px; margin-left: 4px; vertical-align: middle; opacity: 0.5; cursor: pointer; }
    .header-filter:hover { opacity: 1; color: var(--primary); }

    .nx-table {
      width: 100%;
      border-collapse: collapse;
      background: none;
    }

    .actions-column { 
      text-align: left !important; 
      padding-left: 20px !important;
      width: 250px;
    }

    .nx-table td:last-child {
      text-align: left;
      padding-left: 20px;
    }

    .nx-table th, .nx-table td { 
      padding: 12px 16px; 
      text-align: left; 
      border: none;
      background: none;
    }
    .robot-confused { font-size: 4rem; color: var(--primary); margin-bottom: 1rem; opacity: 0.5; }

    .animate-scale-up { animation: scaleUp 0.2s ease-out; }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class UsuariosComponent implements OnInit {

  users: any[] = [];
  roles: any[] = [];
  loading = true;
  saving = false;
  showModal = false;
  editMode = false;
  modalError = '';
  selectedUser: any = null;
  openDropdownId: string | null = null;

  searchText = '';
  viewActive = true;
  activeRoleFilter: string | null = null;

  isOptionsMenuOpen = false;
  isColumnMenuOpen = false;

  columnConfigs = [
    { key: 'usuario', label: 'Usuario', visible: true },
    { key: 'nombre', label: 'Nombre', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'rol', label: 'Rol', visible: true },
    { key: 'empresa', label: 'Empresa', visible: true },
    { key: 'fecha', label: 'Fecha Creado', visible: false },
  ];

  form: any = { firstName: '', lastName: '', email: '', password: '', phone: '', roleId: 2, companyName: '' };

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getRoles().subscribe((r) => this.roles = r.data);
    this.loadUsers();

    document.addEventListener('click', () => {
      this.openDropdownId = null;
      this.isOptionsMenuOpen = false;
    });
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers({}).subscribe({
      next: (r) => {
        this.users = r.data.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get filteredUsers(): any[] {
    let result = [...this.users];
    result = result.filter(u => u.is_active === this.viewActive);
    if (this.activeRoleFilter) result = result.filter(u => u.role === this.activeRoleFilter);

    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.company_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  countByRole(roleName: string) {
    return this.users.filter(u => u.role === roleName && u.is_active === this.viewActive).length;
  }

  toggleActiveView() {
    this.viewActive = !this.viewActive;
    this.openDropdownId = null;
  }

  toggleRoleFilter(roleName: string) {
    this.activeRoleFilter = this.activeRoleFilter === roleName ? null : roleName;
  }

  clearFilters() {
    this.searchText = '';
    this.viewActive = true;
    this.activeRoleFilter = null;
  }

  isColumnVisible(key: string) {
    return this.columnConfigs.find(c => c.key === key)?.visible;
  }

  get visibleColumnsCount() {
    return this.columnConfigs.filter(c => c.visible).length;
  }

  toggleOptionsMenu(e: Event) {
    e.stopPropagation();
    this.isOptionsMenuOpen = !this.isOptionsMenuOpen;
  }

  toggleDropdown(id: string, e: Event) {
    e.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  openCreate() {
    this.editMode = false;
    this.form = { firstName: '', lastName: '', email: '', password: '', phone: '', roleId: 2, companyName: '' };
    this.modalError = '';
    this.showModal = true;
    this.isOptionsMenuOpen = false;
  }

  openEdit(u: any) {
    this.editMode = true;
    this.selectedUser = u;
    this.form = {
      firstName: u.first_name || u.name?.split(' ')[0] || '',
      lastName: u.last_name || u.name?.split(' ').slice(1).join(' ') || '',
      email: u.email,
      phone: u.phone,
      companyName: u.company_name,
      roleId: u.role_id
    };
    this.modalError = '';
    this.showModal = true;
    this.openDropdownId = null;
  }

  closeModal() { this.showModal = false; }

  saveUser() {
    this.saving = true;
    this.modalError = '';
    const payload = { ...this.form };
    const obs = this.editMode
      ? this.adminService.updateUser(this.selectedUser.id, payload)
      : this.adminService.createUser(payload);

    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadUsers(); },
      error: (e) => { this.saving = false; this.modalError = e?.error?.message || 'Error al guardar'; },
    });
  }

  onRoleChange() {
    if (this.isInternalRole()) {
      this.form.companyName = 'Nacionales Delivery Services';
    } else if (this.form.companyName === 'Nacionales Delivery Services') {
      this.form.companyName = '';
    }
  }

  isInternalRole() {
    // 1: Admin, 5: Repartidor
    return this.form.roleId == 1 || this.form.roleId == 5;
  }

  getRoleIcon(role: string): string {
    const r = role?.toUpperCase() || '';
    if (r.includes('ADMIN')) return 'admin_panel_settings';
    if (r.includes('REPARTIDOR')) return 'delivery_dining';
    if (r.includes('ORO')) return 'workspace_premium';
    if (r.includes('PLATA')) return 'military_tech';
    if (r.includes('BRONCE')) return 'social_leaderboard';
    return 'person';
  }

  toggleUserStatus(u: any) {
    const action = u.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${action} al usuario ${u.name}?`)) return;

    const obs: any = u.is_active
      ? this.adminService.deleteUser(u.id)
      : this.adminService.updateUser(u.id, { isActive: true } as any);

    obs.subscribe(() => this.loadUsers());
  }

  exportToExcel() {
    const data = this.filteredUsers.map(u => ({
      Usuario: u.username,
      Nombre: u.name,
      Email: u.email,
      Rol: u.role,
      Empresa: u.company_name || 'N/A',
      Estado: u.is_active ? 'Activo' : 'Inactivo',
      Creado: new Date(u.created_at).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'Reporte_Usuarios_Nexgo.xlsx');
    this.isOptionsMenuOpen = false;
  }
}
