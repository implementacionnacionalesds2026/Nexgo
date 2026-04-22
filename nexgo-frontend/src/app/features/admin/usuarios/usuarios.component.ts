// Usuarios feature component using shared UserListComponent
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { UserListComponent } from '../../../shared/components/user-list/user-list.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, SidebarComponent, UserListComponent],
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
          <app-user-list 
            [users]="users" 
            [roles]="roles" 
            [loading]="loading"
            (onRefresh)="loadUsers()"
          />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-main { padding-top: var(--navbar-height); }
  `]
})
export class UsuariosComponent implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit() {
    this.adminService.getRoles().subscribe((r) => this.roles = r.data);
    this.loadUsers();
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
}
