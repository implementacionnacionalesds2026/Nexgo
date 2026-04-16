import { Component, Input } from '@angular/core';
import { CommonModule }      from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="nx-badge" [class]="'badge-' + status">
      {{ statusLabels[status] || status }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  statusLabels: Record<string, string> = {
    PENDIENTE:   'Pendiente',
    RECOGIDO:    'Recogido',
    EN_TRANSITO: 'En tránsito',
    EN_DESTINO:  'En destino',
    ENTREGADO:   'Entregado',
    CANCELADO:   'Cancelado',
    ADMIN:       'Admin',
    CLIENTE:     'Cliente',
    REPARTIDOR:  'Repartidor',
  };
}
