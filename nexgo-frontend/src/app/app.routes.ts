import { Routes }  from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ── ADMIN ──────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'envios',
        loadComponent: () =>
          import('./features/admin/envios/envios.component').then((m) => m.EnviosAdminComponent),
      },
      {
        path: 'rastreo',
        loadComponent: () =>
          import('./features/admin/rastreo/rastreo.component').then((m) => m.RastreoComponent),
      },
      {
        path: 'tarifas',
        loadComponent: () =>
          import('./features/admin/tarifas/tarifas.component').then((m) => m.TarifasComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
    ],
  },

  // ── CLIENTE ────────────────────────────────────────────────
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard('CLIENTE', 'ADMIN')],
    children: [
      { path: '', redirectTo: 'cotizador', pathMatch: 'full' },
      {
        path: 'cotizador',
        loadComponent: () =>
          import('./features/cliente/cotizador/cotizador.component').then((m) => m.CotizadorComponent),
      },
      {
        path: 'nuevo-envio',
        loadComponent: () =>
          import('./features/cliente/nuevo-envio/nuevo-envio.component').then((m) => m.NuevoEnvioComponent),
      },
      {
        path: 'mis-envios',
        loadComponent: () =>
          import('./features/cliente/mis-envios/mis-envios.component').then((m) => m.MisEnviosComponent),
      },
      {
        path: 'rastrear/:id',
        loadComponent: () =>
          import('./features/cliente/rastrear/rastrear.component').then((m) => m.RastrearComponent),
      },
    ],
  },

  // ── REPARTIDOR ─────────────────────────────────────────────
  {
    path: 'repartidor',
    canActivate: [authGuard, roleGuard('REPARTIDOR', 'ADMIN')],
    children: [
      { path: '', redirectTo: 'guias', pathMatch: 'full' },
      {
        path: 'guias',
        loadComponent: () =>
          import('./features/repartidor/mis-guias/mis-guias.component').then((m) => m.MisGuiasComponent),
      },
      {
        path: 'actualizar/:id',
        loadComponent: () =>
          import('./features/repartidor/actualizar-estado/actualizar-estado.component').then((m) => m.ActualizarEstadoComponent),
      },
      {
        path: 'ubicacion',
        loadComponent: () =>
          import('./features/repartidor/mi-ubicacion/mi-ubicacion.component').then((m) => m.MiUbicacionComponent),
      },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: 'login' },
];
