import { Component } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { GuidesListComponent } from '../../../shared/components/guides-list/guides-list.component';

@Component({
  selector: 'app-guias-page',
  standalone: true,
  imports: [SidebarComponent, GuidesListComponent],
  template: `
    <div class="nx-layout">
      <app-sidebar />
      <main class="nx-main">
        <div class="nx-navbar">
          <span class="navbar-title">
            <span class="material-symbols-outlined" style="vertical-align:bottom;">inventory_2</span> 
            Gestión de Inventario
          </span>
        </div>

        <div class="nx-content" style="padding-top: 2rem;">
          <app-guides-list></app-guides-list>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .nx-main { padding-top: var(--navbar-height); }
  `]
})
export class GuiasComponent {}
