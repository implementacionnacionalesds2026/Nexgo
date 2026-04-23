import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { UserListComponent } from '../../../shared/components/user-list/user-list.component';

@Component({
  selector: 'app-repartidores-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent, UserListComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom;">directions_bike</span> 
            Gestión de Repartidores
          </span>
        </div>

        <div class="nx-content">
          <div class="nx-card" style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(99, 102, 241, 0.05); border: 1px dashed rgba(99, 102, 241, 0.2);">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
              <span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.2rem; margin-right: 8px; color: var(--primary);">info</span>
              Aquí puedes gestionar únicamente a los usuarios con el rol de <b>Repartidor</b>.
            </p>
          </div>
          
          <app-user-list 
            [users]="repartidores" 
            [roles]="roles" 
            [loading]="loading"
            (onRefresh)="loadRepartidores()"
          />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-main { padding-top: var(--navbar-height); }
  `]
})
export class RepartidoresListComponent implements OnInit {
  repartidores: any[] = [];
  roles: any[] = [];
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getRoles().subscribe((r) => {
      this.roles = r.data;
    });
    this.loadRepartidores();
  }

  loadRepartidores() {
    this.loading = true;
    // Buscamos todos los usuarios y filtramos por el rol REPARTIDOR (ID 5)
    this.adminService.getUsers({}).subscribe({
      next: (r) => {
        const allUsers = r.data.data;
        this.repartidores = allUsers.filter((u: any) => u.role_id === 5 || u.roleId === 5);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
