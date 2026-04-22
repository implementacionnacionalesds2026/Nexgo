import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';

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
            Mi Tarifa
          </span>
        </div>
        <div class="nx-content">
          <div class="nx-page-header">
            <h1>Información de Costos</h1>
            <p>Detalles de tu plan actual y beneficios en Nexgo</p>
          </div>

          <div class="tarifas-view">
            @if (userRule) {
              <div class="premium-card" [style.border-top-color]="getTierColor()">
                <div class="card-glow"></div>
                <div class="card-content">
                  <div class="tier-badge" [style.background]="getTierColor() + '20'" [style.color]="getTierColor()">
                    <span class="material-symbols-outlined">{{ getTierIcon() }}</span>
                    {{ getTierName() }}
                  </div>

                  <div class="price-hero">
                    <span class="currency">Q</span>
                    <span class="amount">{{ userRule.base_price }}</span>
                    <span class="per">/ guía</span>
                  </div>

                  <div class="features-list">
                    <div class="feature-item">
                      <span class="material-symbols-outlined check">check_circle</span>
                      <div class="feature-text">
                        <strong>Peso Incluido:</strong>
                        <span>Hasta {{ userRule.base_weight }} {{ userRule.weight_unit }} por paquete.</span>
                      </div>
                    </div>
                    <div class="feature-item">
                      <span class="material-symbols-outlined check">info</span>
                      <div class="feature-text">
                        <strong>Costo Adicional:</strong>
                        <span>Q{{ userRule.extra_weight_price }} por cada {{ userRule.weight_unit }} adicional.</span>
                      </div>
                    </div>
                    <div class="feature-item">
                      <span class="material-symbols-outlined check">verified</span>
                      <div class="feature-text">
                        <strong>Seguro Incluido:</strong>
                        <span>Protección estándar para todos tus envíos.</span>
                      </div>
                    </div>
                  </div>

                  <div class="card-footer">
                    <p>Tu tarifa se aplica automáticamente al crear nuevos envíos.</p>
                  </div>
                </div>
              </div>

              <!-- Info Card -->
              <div class="nx-card info-card animate-fade-in" style="margin-top: 2rem; max-width: 500px;">
                <div style="display:flex; gap: 1rem; align-items:flex-start;">
                  <span class="material-symbols-outlined" style="color:var(--primary);">lightbulb</span>
                  <div>
                    <h4 style="margin:0 0 .5rem 0;">¿Cómo se calcula el total?</h4>
                    <p style="margin:0; font-size:.85rem; color:var(--text-muted); line-height: 1.5;">
                      El costo se basa en tu tarifa base de <strong>Q{{ userRule.base_price }}</strong>. 
                      Si el paquete excede las <strong>{{ userRule.base_weight }} {{ userRule.weight_unit }}</strong>, 
                      se sumarán <strong>Q{{ userRule.extra_weight_price }}</strong> por cada unidad extra detectada al momento de la recolección.
                    </p>
                  </div>
                </div>
              </div>
            } @else {
              <div class="nx-loader">
                <div class="spinner"></div>
                <span>Cargando tu información de tarifa...</span>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .tarifas-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 0;
    }
    .premium-card {
      position: relative;
      width: 100%;
      max-width: 500px;
      background: #1e293b;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.05);
      border-top: 6px solid var(--primary);
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .card-glow {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, var(--primary) 0%, transparent 70%);
      opacity: 0.05;
      pointer-events: none;
    }
    .card-content {
      position: relative;
      padding: 2.5rem;
      z-index: 1;
    }
    .tier-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2rem;
    }
    .price-hero {
      margin-bottom: 2.5rem;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }
    .price-hero .currency { font-size: 2rem; font-weight: 300; color: var(--text-muted); }
    .price-hero .amount { font-size: 5rem; font-weight: 800; color: #fff; line-height: 1; }
    .price-hero .per { font-size: 1.25rem; color: var(--text-muted); font-weight: 500; }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .feature-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .feature-item .check { color: var(--primary); font-size: 1.5rem; }
    .feature-text { display: flex; flex-direction: column; gap: 0.25rem; }
    .feature-text strong { font-size: 0.9rem; color: #f8fafc; }
    .feature-text span { font-size: 0.85rem; color: var(--text-muted); }

    .card-footer {
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.05);
      text-align: center;
    }
    .card-footer p { margin: 0; font-size: 0.75rem; color: var(--text-muted); font-style: italic; }

    .info-card { background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.1); }
  `]
})
export class ClientTarifasComponent implements OnInit {
  private auth = inject(AuthService);
  private admin = inject(AdminService);
  
  user = this.auth.currentUser();
  userRule: any = null;

  ngOnInit() {
    if (this.user) {
      this.admin.getPricingRules().subscribe(res => {
        if (res.success) {
          // Filtrar por el rol actual del usuario
          this.userRule = (res.data as any[]).find((r: any) => r.role_id === (this.user as any)?.role_id);
        }
      });
    }
  }

  getTierName() {
    if (!this.user) return 'Cliente';
    const names: any = { 'SMALL_CUSTOMER': 'Plan Bronce', 'AVERAGE_CUSTOMER': 'Plan Plata', 'FULL_CUSTOMER': 'Plan Oro' };
    return names[this.user.role] || 'Cliente Estándar';
  }

  getTierColor() {
    const colors: any = { 'SMALL_CUSTOMER': '#cd7f32', 'AVERAGE_CUSTOMER': '#94a3b8', 'FULL_CUSTOMER': '#f59e0b' };
    return colors[this.user?.role || ''] || '#6366f1';
  }

  getTierIcon() {
    const icons: any = { 'SMALL_CUSTOMER': 'workspace_premium', 'AVERAGE_CUSTOMER': 'stars', 'FULL_CUSTOMER': 'military_tech' };
    return icons[this.user?.role || ''] || 'person';
  }
}
