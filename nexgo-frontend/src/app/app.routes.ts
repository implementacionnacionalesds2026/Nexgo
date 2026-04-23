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
    canActivate: [authGuard, roleGuard('ADMIN', 'GESTOR_ADMINISTRATIVO')],
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
        path: 'tarifas',
        loadComponent: () =>
          import('./features/admin/tarifas/tarifas.component').then((m) => m.AdminTarifasComponent),
      },
      {
        path: 'guias',
        loadComponent: () =>
          import('./features/admin/guias/guias.component').then((m) => m.GuiasComponent),
      },
      {
        path: 'repartidores',
        loadComponent: () =>
          import('./features/admin/repartidores/repartidores-list.component').then((m) => m.RepartidoresListComponent),
      },
    ],
  },

  // ── CLIENTE ────────────────────────────────────────────────
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard('SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'ADMIN', 'GESTOR_ADMINISTRATIVO')],
    children: [
      { path: '', redirectTo: 'mis-envios', pathMatch: 'full' },
      {
        path: 'cotizador',
        canActivate: [roleGuard('AVERAGE_CUSTOMER', 'ADMIN', 'GESTOR_ADMINISTRATIVO')],
        loadComponent: () =>
          import('./features/cliente/cotizador/cotizador.component').then((m) => m.CotizadorComponent),
      },
      {
        path: 'tarifas',
        canActivate: [roleGuard('SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER', 'ADMIN', 'GESTOR_ADMINISTRATIVO')],
        loadComponent: () =>
          import('./features/cliente/tarifas/tarifas.component').then((m) => m.ClientTarifasComponent),
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
        path: 'ver-solicitud/:id',
        loadComponent: () =>
          import('./features/cliente/ver-solicitud/ver-solicitud.component').then((m) => m.VerSolicitudComponent),
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
