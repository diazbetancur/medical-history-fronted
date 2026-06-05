import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env';
import { finalize } from 'rxjs';
import { HttpLoadingService } from './http-loading.service';

const LOADING_EXCLUDED_URL_PATTERNS = [
  '/public/search/suggest',
  '/notifications',   // silent — count poll + list fetch must not trigger overlay
];

function isApiRequest(url: string): boolean {
  const apiBase = environment.apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(apiBase) || url.includes('/api/');
}

function shouldTrackLoading(url: string): boolean {
  return (
    isApiRequest(url) &&
    !LOADING_EXCLUDED_URL_PATTERNS.some((pattern) => url.includes(pattern))
  );
}

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const httpLoading = inject(HttpLoadingService);

  if (!shouldTrackLoading(req.url)) {
    return next(req);
  }

  httpLoading.begin();

  return next(req).pipe(finalize(() => httpLoading.end()));
};
