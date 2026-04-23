import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asignar-ruta',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="content-header">
        <div>
          <h2>Asignar Ruta</h2>
          <p class="text-muted">Aquí podrás asignar rutas a los repartidores</p>
        </div>
      </div>

      <div class="nx-card p-6 text-center">
        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--text-muted); margin-bottom: 1rem;">
          alt_route
        </span>
        <h3 style="margin-bottom: 0.5rem;">Módulo en construcción</h3>
        <p class="text-muted">Esta funcionalidad estará disponible próximamente.</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }
    .content-header {
      margin-bottom: 2rem;
    }
    h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 0.5rem 0;
    }
    .text-muted {
      color: var(--text-muted);
      margin: 0;
    }
    .nx-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .p-6 {
      padding: 1.5rem;
    }
    .text-center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AsignarRutaComponent {}
