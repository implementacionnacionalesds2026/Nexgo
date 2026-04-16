import { inject }        from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router }        from '@angular/router';
import { AuthService }   from '../services/auth.service';

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.currentUser();

    if (!user || !allowedRoles.includes(user.role)) {
      // Redirigir al dashboard del rol actual
      if (user?.role === 'ADMIN')       router.navigate(['/admin/dashboard']);
      else if (user?.role === 'CLIENTE') router.navigate(['/cliente/cotizador']);
      else if (user?.role === 'REPARTIDOR') router.navigate(['/repartidor/guias']);
      else router.navigate(['/login']);
      return false;
    }
    return true;
  };
};
