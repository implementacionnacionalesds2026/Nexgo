import { Component }          from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { AuthService }          from '../../../core/services/auth.service';
import { SidebarComponent }     from '../../../shared/components/sidebar/sidebar.component';

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

        <!-- Alert -->
        @if (error) {
          <div class="nx-alert alert-error">
            <span>⚠️</span> {{ error }}
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="nx-form-group">
            <label for="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              class="nx-input"
              placeholder="usuario@empresa.gt"
              [(ngModel)]="email"
              name="email"
              required
              autocomplete="email"
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
              {{ showPassword ? '🙈 Ocultar' : '👁️ Mostrar' }} contraseña
            </button>
          </div>

          <button
            type="submit"
            class="nx-btn btn-accent btn-block btn-lg"
            [disabled]="loading"
            style="margin-top:.5rem;"
          >
            @if (loading) { <span class="spinner" style="width:18px;height:18px;border-width:2px;"></span> Iniciando... }
            @else { 🚀 Iniciar sesión }
          </button>
        </form>

        <!-- Demo Accounts -->
        <div style="margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid var(--border);">
          <p style="font-size:.75rem;color:var(--text-muted);text-align:center;margin-bottom:.75rem;">
            Cuentas de demostración
          </p>
          <div style="display:flex;flex-direction:column;gap:.45rem;">
            @for (demo of demoCredentials; track demo.email) {
              <button
                class="nx-btn btn-ghost btn-sm"
                (click)="fillDemo(demo)"
              >
                <span>{{ demo.icon }}</span>
                {{ demo.label }}
                <span style="margin-left:auto;font-size:.7rem;color:var(--text-muted)">{{ demo.email }}</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {

  email     = '';
  password  = '';
  loading   = false;
  error     = '';
  showPassword = false;

  demoCredentials = [
    { email: 'admin@nexgo.gt',       password: 'Admin1234!',   label: 'Administrador', icon: '🔑' },
    { email: 'cliente@demo.gt',      password: 'Admin1234!',   label: 'Cliente',       icon: '🏢' },
    { email: 'repartidor@nexgo.gt',  password: 'Admin1234!',   label: 'Repartidor',    icon: '🚚' },
  ];

  constructor(private authService: AuthService) {}

  fillDemo(demo: { email: string; password: string }) {
    this.email    = demo.email;
    this.password = demo.password;
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Por favor ingresa tus credenciales';
      return;
    }

    this.loading = true;
    this.error   = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.data.user.role;
        // La redirección la maneja el guard/HomeComponent
        if (role === 'ADMIN')       window.location.href = '/admin/dashboard';
        else if (role === 'CLIENTE') window.location.href = '/cliente/cotizador';
        else window.location.href = '/repartidor/guias';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Error al iniciar sesión';
      },
    });
  }
}
