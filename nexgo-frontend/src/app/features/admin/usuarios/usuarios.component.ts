import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { AdminService }        from '../../../core/services/admin.service';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { User }                from '../../../core/models/user.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, StatusBadgeComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">group</span> Gestión de Usuarios</span>
        </div>

        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Usuarios del Sistema</h1>
            <p>CRUD completo de administradores, clientes y repartidores</p>
            <div class="header-actions">
              <select class="nx-input" style="width:160px;" [(ngModel)]="roleFilter" (change)="loadUsers()">
                <option value="">Todos los roles</option>
                @for (r of roles; track r.id) {
                  <option [value]="r.name">{{ r.name }}</option>
                }
              </select>
              <button class="nx-btn btn-accent" (click)="openCreate()">➕ Nuevo Usuario</button>
            </div>
          </div>

          @if (loading) { <div class="nx-loader"><div class="spinner"></div></div> }

          @if (!loading) {
            <div class="nx-card" style="padding:0;">
              <div class="nx-table-wrap">
                <table class="nx-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Empresa</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of users; track u.id) {
                      <tr>
                        <td>{{ u.name }}</td>
                        <td style="color:var(--text-muted);font-size:.85rem;">{{ u.email }}</td>
                        <td><app-status-badge [status]="u.role" /></td>
                        <td style="color:var(--text-muted);font-size:.85rem;">{{ u['company_name'] || '—' }}</td>
                        <td>
                          <span [style.color]="u.isActive ? '#34D399' : '#F87171'">
                            {{ u.isActive ? '✓ Activo' : '✗ Inactivo' }}
                          </span>
                        </td>
                        <td>
                          <div style="display:flex;gap:.5rem;">
                            <button class="nx-btn btn-ghost btn-sm" (click)="openEdit(u)">✏️</button>
                            <button class="nx-btn btn-danger btn-sm" (click)="deactivate(u)">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (users.length === 0) {
                      <tr><td colspan="6"><div class="nx-empty"><div class="empty-icon"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">group</span></div><h3>Sin usuarios</h3></div></td></tr>
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
        <div class="nx-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editMode ? '✏️ Editar Usuario' : '➕ Nuevo Usuario' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            @if (modalError) { <div class="nx-alert alert-error"><span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">warning</span> {{ modalError }}</div> }

            <div class="nx-form-row cols-2">
              <div class="nx-form-group">
                <label>Nombre completo</label>
                <input class="nx-input" [(ngModel)]="form.name" placeholder="Juan Pérez" />
              </div>
              <div class="nx-form-group">
                <label>Teléfono</label>
                <input class="nx-input" [(ngModel)]="form.phone" placeholder="502XXXXXXXX" />
              </div>
            </div>
            <div class="nx-form-group">
              <label>Email</label>
              <input class="nx-input" type="email" [(ngModel)]="form.email" [disabled]="editMode" placeholder="usuario@empresa.gt" />
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
                <select class="nx-input" [(ngModel)]="form.roleId">
                  @for (r of roles; track r.id) {
                    <option [value]="r.id">{{ r.name }}</option>
                  }
                </select>
              </div>
              <div class="nx-form-group">
                <label>Empresa (clientes)</label>
                <input class="nx-input" [(ngModel)]="form.companyName" placeholder="Empresa S.A." />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="nx-btn btn-ghost" (click)="closeModal()">Cancelar</button>
            <button class="nx-btn btn-primary" (click)="saveUser()" [disabled]="saving">
              {{ saving ? 'Guardando...' : (editMode ? 'Actualizar' : 'Crear usuario') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UsuariosComponent implements OnInit {

  users:   any[] = [];
  roles:   any[] = [];
  loading  = true;
  saving   = false;
  showModal = false;
  editMode  = false;
  roleFilter = '';
  modalError = '';
  selectedUser: any = null;

  form: any = { name: '', email: '', password: '', phone: '', roleId: 2, companyName: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getRoles().subscribe((r) => this.roles = r.data);
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    const filters = this.roleFilter ? { role: this.roleFilter } : {};
    this.adminService.getUsers(filters).subscribe({
      next: (r) => { this.users = r.data.data; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  openCreate() {
    this.editMode = false;
    this.form = { name: '', email: '', password: '', phone: '', roleId: 2, companyName: '' };
    this.modalError = '';
    this.showModal = true;
  }

  openEdit(u: any) {
    this.editMode = true;
    this.selectedUser = u;
    this.form = { name: u.name, email: u.email, phone: u.phone, companyName: u.company_name, roleId: null };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveUser() {
    this.saving = true;
    this.modalError = '';

    const obs = this.editMode
      ? this.adminService.updateUser(this.selectedUser.id, {
          name: this.form.name, phone: this.form.phone,
          companyName: this.form.companyName,
        } as any)
      : this.adminService.createUser(this.form);

    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadUsers(); },
      error: (e) => { this.saving = false; this.modalError = e?.error?.message || 'Error al guardar'; },
    });
  }

  deactivate(u: any) {
    if (!confirm(`¿Desactivar al usuario ${u.name}?`)) return;
    this.adminService.deleteUser(u.id).subscribe(() => this.loadUsers());
  }
}
