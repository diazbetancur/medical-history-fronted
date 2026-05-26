import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
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
  loadingInterceptor,
  retryInterceptor,
} from '@core/http';
import { GeographyMetadataService } from './public/services';
import { catchError, of } from 'rxjs';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loadingInterceptor,       // 1st: Track active API requests globally
        correlationIdInterceptor, // 2nd: Add correlation ID to all requests
        jwtInterceptor,           // 3rd: Add JWT token for auth
        retryInterceptor,         // 4th: Auto-retry GET/HEAD/OPTIONS on 5xx/network (M-05)
        errorInterceptor,         // 5th: Handle redirects, fallback toast, and normalize
      ]),
    ),
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => inject(AuthStore).initialize()),
    provideAppInitializer(() => {
      inject(GeographyMetadataService)
        .loadHondurasGeographyIfNeeded()
        .pipe(catchError(() => of(void 0)))
        .subscribe();
    }),
  ],
};
