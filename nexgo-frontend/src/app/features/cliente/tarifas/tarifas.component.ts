import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { SidebarComponent }    from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-tarifas-cliente',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom; font-size:inherit;">payments</span> 
            Mis Tarifas Negociadas
          </span>
        </div>
        
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Tarifas de mi Empresa</h1>
            <p>A continuación se detallan las tarifas fijas y condiciones negociadas para tus envíos.</p>
          </div>

          <div class="nx-card">
            <div class="nx-empty">
              <div class="empty-icon">
                <span class="material-symbols-outlined" style="font-size: 48px;">handshake</span>
              </div>
              <h3>Módulo en parametrización</h3>
              <p>Estamos configurando tus tarifas personalizadas. Por favor, contacta a tu asesor comercial para más detalles.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-empty {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }
    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
  `]
})
export class TarifasClienteComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
