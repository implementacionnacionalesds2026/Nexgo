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

          <div class="tarifas-container animate-fade-in">
            @if (userRule) {
              <div class="stats-card-premium" [style.--glow-color]="getTierColor()">
                <div class="card-glow"></div>
                <span class="material-symbols-outlined watermark">{{ getTierIcon() }}</span>
                
                <div class="card-body">
                  <div class="header-row">
                    <div class="tier-label">
                      {{ getTierName() }}
                    </div>
                    @if (userRule.user_id) {
                      <div class="verified-tag">
                        <span class="material-symbols-outlined">verified</span>
                        PERSONALIZADA
                      </div>
                    }
                  </div>

                  <div class="price-display">
                    <span class="currency">Q</span>
                    <span class="value">{{ userRule.base_price }}</span>
                    <span class="label">/ ENVÍO BASE</span>
                  </div>

                  <div class="info-grid">
                    <div class="info-item">
                      <div class="info-label">PESO INCLUIDO</div>
                      <div class="info-value">
                        {{ userRule.base_weight }} <span class="unit">{{ userRule.weight_unit || 'LB' }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-label">LIBRA EXTRA</div>
                      <div class="info-value">
                        Q{{ userRule.extra_weight_price }} <span class="unit">/ LB</span>
                      </div>
                    </div>
                  </div>

                  <div class="footer-note">
                    <span class="material-symbols-outlined">info</span>
                    Tu tarifa se aplica automáticamente a cada nueva guía.
                  </div>
                </div>
              </div>

              <!-- Supplementary info -->
              <div class="calculation-guide">
                <div class="guide-header">
                  <span class="material-symbols-outlined">calculate</span>
                  ¿Cómo se calcula el total?
                </div>
                <p>
                  El costo base de <strong>Q{{ userRule.base_price }}</strong> cubre hasta <strong>{{ userRule.base_weight }}{{ userRule.weight_unit || 'LB' }}</strong>. 
                  Si tu paquete pesa más, se sumarán <strong>Q{{ userRule.extra_weight_price }}</strong> por cada unidad adicional detectada.
                </p>
              </div>

            } @else if (loading) {
              <div class="loading-state">
                <div class="spinner"></div>
                <span>Consultando tu tarifa...</span>
              </div>
            } @else {
              <div class="error-state">
                <span class="material-symbols-outlined">sentiment_dissatisfied</span>
                <h3>Sin tarifa activa</h3>
                <p>No pudimos localizar una tarifa para tu perfil. Contacta a soporte.</p>
                <div class="debug-info">
                   ID: {{ user()?.id?.substring(0,8) }}... | Rol: {{ user()?.role }}
                </div>
                <button class="nx-btn btn-primary" (click)="ngOnInit()">
                  <span class="material-symbols-outlined">refresh</span> REINTENTAR
                </button>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .tarifas-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
    }

    /* Stats Card Premium Style */
    .stats-card-premium {
      position: relative;
      width: 100%;
      max-width: 480px;
      background: #111827;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: default;
      animation: cardEntrance 0.8s ease-out;
    }

    .stats-card-premium:hover {
      transform: translateY(-10px) scale(1.02) rotateX(2deg);
      box-shadow: 0 30px 60px rgba(0,0,0,0.6), 0 0 20px var(--glow-color)20;
      border-color: var(--glow-color)40;
    }

    .stats-card-premium::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, var(--glow-color), transparent);
      z-index: 10;
      animation: borderPulse 3s infinite;
    }

    .card-glow {
      position: absolute;
      top: 0; right: 0;
      width: 250px; height: 250px;
      background: radial-gradient(circle at top right, var(--glow-color), transparent 70%);
      opacity: 0.15;
      pointer-events: none;
      transition: opacity 0.5s ease;
    }

    .stats-card-premium:hover .card-glow {
      opacity: 0.25;
    }

    .watermark {
      position: absolute;
      bottom: -20px;
      right: -10px;
      font-size: 12rem;
      color: white;
      opacity: 0.03;
      pointer-events: none;
      user-select: none;
      transition: all 0.8s ease;
      animation: floating 6s ease-in-out infinite;
    }

    .stats-card-premium:hover .watermark {
      transform: scale(1.1) rotate(-5deg);
      opacity: 0.05;
    }

    .card-body {
      position: relative;
      padding: 3rem 2.5rem;
      z-index: 1;
    }

    /* ... Rest of styles remain similar but with better spacing ... */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .tier-label {
      font-size: 0.8rem;
      font-weight: 900;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    .verified-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 900;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 6px 14px;
      border-radius: 100px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .price-display {
      margin-bottom: 2.5rem;
    }

    .price-display .currency {
      font-size: 2rem;
      color: var(--glow-color);
      font-weight: 300;
      margin-right: 6px;
    }

    .price-display .value {
      font-size: 5rem;
      font-weight: 900;
      color: white;
      line-height: 0.8;
      letter-spacing: -2px;
    }

    /* Keyframes */
    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(40px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes floating {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes borderPulse {
      0%, 100% { opacity: 0.5; filter: brightness(1); }
      50% { opacity: 1; filter: brightness(1.5) blur(1px); }
    }

    /* Reusing existing logic for grid and guide */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      background: rgba(255,255,255,0.03);
      padding: 1.5rem;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .info-item .info-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
    .info-item .info-value { font-size: 1.5rem; font-weight: 800; color: white; }
    .info-value .unit { font-size: 0.85rem; color: var(--text-muted); font-weight: 400; }

    .footer-note {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.75rem;
      color: var(--text-muted);
      background: rgba(0,0,0,0.3);
      padding: 10px 16px;
      border-radius: 12px;
    }

    .calculation-guide {
      width: 100%;
      max-width: 480px;
      padding: 1.5rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
      animation: cardEntrance 1s ease-out 0.2s backwards;
    }

    .guide-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: white;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .calculation-guide p {
      margin: 0;
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .loading-state, .error-state {
      padding: 4rem;
      text-align: center;
    }

    .debug-info {
      font-family: monospace;
      font-size: 0.65rem;
      color: var(--text-muted);
      margin: 1rem 0;
      background: rgba(0,0,0,0.2);
      padding: 8px;
      border-radius: 6px;
    }
  `]
})
export class ClientTarifasComponent implements OnInit {
  private auth = inject(AuthService);
  private admin = inject(AdminService);
  
  user = this.auth.currentUser; // Es la señal misma
  userRule: any = null;
  loading: boolean = true;
  rulesCount: number = 0;

  ngOnInit() {
    this.loading = true;
    const currentUser = this.user();
    if (currentUser) {
      console.log('CLIENTE DEBUG - Usuario actual:', currentUser);
      this.admin.getPricingRules().subscribe({
        next: (res: any) => {
          if (res.success) {
            const rules = res.data as any[];
            this.rulesCount = rules.length;
            console.log('CLIENTE DEBUG - Todas las reglas:', rules);
            
            // 1. Prioridad: Tarifa personalizada para este usuario específico
            let rule = rules.find(r => {
              const r_uid = r.user_id || r.userId;
              const match = r_uid && r_uid == currentUser.id && r.is_active;
              if (match) console.log('CLIENTE DEBUG - ¡Match Personalizado!', r.name);
              return match;
            });
            
            // 2. Fallback: Tarifa de su nivel (Bronce, Plata, Oro)
            if (!rule) {
              let roleId = (currentUser as any)?.role_id;
              if (!roleId) {
                const roleMapping: any = { 'SMALL_CUSTOMER': 2, 'AVERAGE_CUSTOMER': 3, 'FULL_CUSTOMER': 4 };
                roleId = roleMapping[currentUser.role || ''];
              }
              console.log('CLIENTE DEBUG - Buscando fallback por RoleID:', roleId);

              rule = rules.find(r => {
                const r_rid = r.role_id || r.roleId;
                const r_uid = r.user_id || r.userId;
                return r_rid == roleId && !r_uid && r.is_active;
              });
              if (rule) console.log('CLIENTE DEBUG - ¡Match por Nivel!', rule.name);
            }
            
            this.userRule = rule;
            if (!rule) console.warn('CLIENTE DEBUG - No se encontró regla para:', this.user()?.id);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('CLIENTE DEBUG - Error API:', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  getTierName() {
    const user = this.user();
    if (!user) return 'Cliente';
    const names: any = { 'SMALL_CUSTOMER': 'Plan Bronce', 'AVERAGE_CUSTOMER': 'Plan Plata', 'FULL_CUSTOMER': 'Plan Oro' };
    return names[user.role] || 'Cliente Estándar';
  }

  getTierColor() {
    const user = this.user();
    const colors: any = { 'SMALL_CUSTOMER': '#cd7f32', 'AVERAGE_CUSTOMER': '#94a3b8', 'FULL_CUSTOMER': '#f59e0b' };
    return colors[user?.role || ''] || '#6366f1';
  }

  getTierIcon() {
    const user = this.user();
    const icons: any = { 'SMALL_CUSTOMER': 'workspace_premium', 'AVERAGE_CUSTOMER': 'stars', 'FULL_CUSTOMER': 'military_tech' };
    return icons[user?.role || ''] || 'person';
  }
}
