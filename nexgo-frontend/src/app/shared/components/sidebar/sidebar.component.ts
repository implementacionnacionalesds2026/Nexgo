import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule }   from '@angular/common';
import { AuthService }    from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="nx-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">NX</div>
        <div class="logo-text">
          <div class="name">Nexgo</div>
          <div class="tagline">Nacionales Delivery</div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="sidebar-nav">
        <div class="nav-section-title">Menú principal</div>

        @for (item of visibleItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nx-nav-item"
            [title]="item.label"
          >
            <span class="nav-icon material-symbols-outlined">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </div>

      <!-- Footer: User info + Logout -->
      <div class="sidebar-footer">
        <div class="user-info" style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;">
          <div class="avatar" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;color:white;">
            {{ userInitial }}
          </div>
          <div style="overflow:hidden;">
            <div style="font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ user?.name }}</div>
            <div style="font-size:.72rem;color:var(--text-muted);">{{ user?.role }}</div>
          </div>
        </div>
        <button class="nx-nav-item" (click)="logout()" style="color:#F87171;">
          <span class="nav-icon material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  `,
})
export class SidebarComponent implements OnInit {

  private authService = inject(AuthService);
  user = this.authService.currentUser();
  userInitial = this.user?.name?.charAt(0)?.toUpperCase() || 'U';

  private allNavItems: NavItem[] = [
    // ADMIN & GESTOR
    { label: 'Dashboard',     icon: 'dashboard', route: '/admin/dashboard',     roles: ['ADMIN'] },
    { label: 'Tarifas',       icon: 'payments', route: '/admin/tarifas',        roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Usuarios',      icon: 'group', route: '/admin/usuarios',       roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Envíos',        icon: 'inventory_2', route: '/admin/envios',         roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Repartidores',  icon: 'directions_bike', route: '/admin/repartidores', roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },

    // CLIENTE & GESTOR (Operational)
    { label: 'Cotizador',     icon: 'calculate', route: '/cliente/cotizador',    roles: ['AVERAGE_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Tarifas',       icon: 'payments', route: '/cliente/tarifas',      roles: ['FULL_CUSTOMER', 'AVERAGE_CUSTOMER'] },
    { label: 'Nuevo Envío',   icon: 'add_box', route: '/cliente/nuevo-envio',  roles: ['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Mis Envíos',    icon: 'inventory_2', route: '/cliente/mis-envios',   roles: ['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },

    // REPARTIDOR
    { label: 'Mis Guías',     icon: 'assignment', route: '/repartidor/guias',     roles: ['REPARTIDOR'] },
    { label: 'Mi Ubicación',  icon: 'my_location', route: '/repartidor/ubicacion', roles: ['REPARTIDOR'] },
  ];

  get visibleItems(): NavItem[] {
    const role = this.user?.role || '';
    return this.allNavItems.filter((i) => i.roles.includes(role));
  }

  constructor() {}

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.userInitial = this.user?.name?.charAt(0)?.toUpperCase() || 'U';
  }

  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir del sistema?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#ffffff'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Vuelve pronto',
          timer: 1500,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#ffffff'
        }).then(() => {
          this.authService.logout();
        });
      }
    });
  }
}
