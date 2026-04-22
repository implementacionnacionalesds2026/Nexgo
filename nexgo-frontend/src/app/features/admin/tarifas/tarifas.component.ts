import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { PricingListComponent } from '../../../shared/components/pricing-list/pricing-list.component';

@Component({
  selector: 'app-tarifas-admin',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PricingListComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom;">payments</span> 
            Gestión de Tarifas
          </span>
        </div>

        <div class="nx-content">
          <app-pricing-list />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-main { padding-top: var(--navbar-height); }
  `]
})
export class AdminTarifasComponent {}
