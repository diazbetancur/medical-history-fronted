import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthStore } from '@core/auth';
import {
  correlationIdInterceptor,
  errorInterceptor,
  jwtInterceptor,
} from '@core/http';
import { routes } from './app.routes';

/**
 * Initialize AuthStore on app startup
 * Checks for valid token and loads user session
 */
function initializeAuth() {
  const authStore = inject(AuthStore);
  return () => authStore.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        correlationIdInterceptor, // 1st: Add correlation ID to all requests
        jwtInterceptor, // 2nd: Add JWT token for auth
        errorInterceptor, // 3rd: Handle errors and normalize
      ]),
    ),
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Initialize AuthStore on app startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
  ],
};
