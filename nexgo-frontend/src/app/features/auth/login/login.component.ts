import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="nx-login-page">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-icon">NX</div>
          <h1>Nexgo</h1>
          <p>Nacionales Delivery Services</p>
          <p class="text-muted" style="margin-top:.35rem;font-size:.78rem;">Sistema de Paquetería Nacional · Guatemala</p>
        </div>


        <!-- Form -->
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="nx-form-group">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              class="nx-input"
              placeholder="juan.perez"
              [(ngModel)]="username"
              name="username"
              required
              autocomplete="username"
            />
          </div>

          <div class="nx-form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              [type]="showPassword ? 'text' : 'password'"
              class="nx-input"
              placeholder="Tu contraseña"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              (click)="showPassword = !showPassword"
              style="background:none;border:none;color:var(--text-muted);font-size:.78rem;cursor:pointer;margin-top:.35rem;padding:0;"
            >
              @if (showPassword) {
                <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">visibility_off</span> Ocultar
              } @else {
                <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">visibility</span> Mostrar
              }
              contraseña
            </button>
          </div>

          <button
            type="submit"
            class="nx-btn btn-accent btn-block btn-lg"
            [disabled]="loading"
            style="margin-top:.5rem;"
          >
            @if (loading) { <span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Iniciando... }
            @else { <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">rocket_launch</span> Iniciar sesión }
          </button>
        </form>


      </div>
    </div>
  `,
})
export class LoginComponent {

  username = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  constructor(private authService: AuthService) { }

  onLogin() {
    if (!this.username || !this.password) {
      Swal.fire({
        icon: 'error',
        title: 'Credenciales incompletas',
        text: 'Por favor ingresa tu usuario y contraseña',
        background: '#1e293b',
        color: '#ffffff',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        const user = res.data.user;
        
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido de nuevo!',
          text: `Hola, ${user.name}`,
          timer: 1500,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#ffffff'
        }).then(() => {
          const role = user.role;
          if (role === 'ADMIN') {
            window.location.href = '/admin/dashboard';
          } else if (['SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER'].includes(role)) {
            window.location.href = '/cliente/mis-envios';
          } else {
            window.location.href = '/repartidor/guias';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error de acceso',
          text: err?.error?.message || 'Credenciales incorrectas o error de servidor',
          background: '#1e293b',
          color: '#ffffff',
          confirmButtonColor: '#f43f5e'
        });
      },
    });
  }
}
