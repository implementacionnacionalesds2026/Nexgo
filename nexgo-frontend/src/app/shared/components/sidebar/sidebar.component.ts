import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
  children?: NavItem[];
}

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

        @for (item of visibleItems; track item.label) {
          @if (item.children) {
            <div class="menu-group">
              <button
                class="nx-nav-item menu-parent"
                type="button"
                [class.active]="isParentActive(item)"
                (click)="toggleMenu(item.label)"
              >
                <div class="menu-parent-left">
                  <span class="nav-icon material-symbols-outlined">{{ item.icon }}</span>
                  <span class="nav-label">{{ item.label }}</span>
                </div>

                <span class="material-symbols-outlined expand-icon">
                  {{ openMenus[item.label] ? 'expand_less' : 'expand_more' }}
                </span>
              </button>

              <div class="submenu" [class.open]="openMenus[item.label]">
                @for (child of item.children; track child.route) {
                  <a
                    [routerLink]="child.route"
                    routerLinkActive="active"
                    class="nx-nav-item submenu-item"
                  >
                    <span class="nav-icon material-symbols-outlined">{{ child.icon }}</span>
                    <span class="nav-label">{{ child.label }}</span>
                  </a>
                }
              </div>
            </div>
          } @else {
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
        }
      </div>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-info" style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;">
          <div
            class="avatar"
            style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent-2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;color:white;"
          >
            {{ userInitial }}
          </div>

          <div style="overflow:hidden;">
            <div style="font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ user?.name }}
            </div>
            <div style="font-size:.72rem;color:var(--text-muted);">
              {{ user?.role }}
            </div>
          </div>
        </div>

        <button class="nx-nav-item" (click)="logout()" style="color:#F87171;" type="button">
          <span class="nav-icon material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .menu-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }

    .menu-parent {
      width: 100%;
      justify-content: space-between !important;
      cursor: pointer;
      background: transparent;
      border: none;
      text-align: left;
      font-family: inherit;
    }

    .menu-parent-left {
      display: flex;
      align-items: center;
      gap: .75rem;
    }

    .expand-icon {
      font-size: 20px;
      transition: transform 0.3s ease;
      color: var(--text-muted);
    }

    .menu-parent:hover .expand-icon,
    .menu-parent.active .expand-icon {
      color: var(--text-main);
    }

    .submenu {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }

    .submenu.open {
      max-height: 400px;
      opacity: 1;
    }

    .submenu-item {
      padding-left: 3rem !important;
      font-size: 0.9em;
      margin-top: 2px;
    }
  `]
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser();
  userInitial = this.user?.name?.charAt(0)?.toUpperCase() || 'U';

  openMenus: { [key: string]: boolean } = {
    Repartidores: true
  };

  private allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', roles: ['ADMIN'] },
    { label: 'Tarifas', icon: 'payments', route: '/admin/tarifas', roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Guías', icon: 'assignment', route: '/admin/guias', roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Usuarios', icon: 'group', route: '/admin/usuarios', roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Envíos', icon: 'inventory_2', route: '/admin/envios', roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'] },
    {
      label: 'Repartidores',
      icon: 'directions_bike',
      route: '',
      roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO'],
      children: [
        {
          label: 'Rastreo Live',
          icon: 'map',
          route: '/admin/rastreo',
          roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO']
        },
        {
          label: 'Asignar Ruta',
          icon: 'alt_route',
          route: '/admin/asignar-ruta',
          roles: ['ADMIN', 'GESTOR_ADMINISTRATIVO']
        }
      ]
    },

    { label: 'Cotizador', icon: 'calculate', route: '/cliente/cotizador', roles: ['AVERAGE_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Tarifas', icon: 'payments', route: '/cliente/tarifas', roles: ['FULL_CUSTOMER', 'AVERAGE_CUSTOMER'] },
    { label: 'Nuevo Envío', icon: 'add_box', route: '/cliente/nuevo-envio', roles: ['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },
    { label: 'Mis Envíos', icon: 'inventory_2', route: '/cliente/mis-envios', roles: ['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'GESTOR_ADMINISTRATIVO'] },

    { label: 'Mis Guías', icon: 'assignment', route: '/repartidor/guias', roles: ['REPARTIDOR'] },
    { label: 'Mi Ubicación', icon: 'my_location', route: '/repartidor/ubicacion', roles: ['REPARTIDOR'] },
  ];

  get visibleItems(): NavItem[] {
    const role = this.user?.role || '';
    return this.allNavItems.filter((i) => i.roles.includes(role));
  }

  ngOnInit(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/admin/rastreo') || currentUrl.includes('/admin/asignar-ruta')) {
      this.openMenus['Repartidores'] = true;
    }
  }

  toggleMenu(label: string) {
    this.openMenus[label] = !this.openMenus[label];
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.router.url.includes(child.route));
  }

  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión actual se cerrará.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6366F1',
      cancelButtonColor: '#6B7280',
      background: '#0B1120',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}
