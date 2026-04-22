import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withViewTransitions }             from '@angular/router';
import { provideHttpClient, withInterceptors }            from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { routes }          from './app.routes';
import { jwtInterceptor }  from './core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([jwtInterceptor, loadingInterceptor])),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
