import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ToastService } from '@shared/services';
import { throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

const API = 'http://localhost:5254/api';

describe('errorInterceptor', () => {
  let router: jasmine.SpyObj<Router>;
  let authStore: jasmine.SpyObj<AuthStore>;
  let toast: jasmine.SpyObj<ToastService>;
  let injector: Injector;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: '/some/page',
    });
    authStore = jasmine.createSpyObj<AuthStore>('AuthStore', ['expireSession']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', [
      'error',
      'success',
      'warning',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthStore, useValue: authStore },
        { provide: ToastService, useValue: toast },
      ],
    });
    injector = TestBed.inject(Injector);
  });

  function run(url: string, status: number, body: unknown = {}) {
    const req = new HttpRequest('GET', url);
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status, error: body, url }));
    return runInInjectionContext(injector, () => errorInterceptor(req, next));
  }

  it('on 401 for an API request: expires the session and redirects home with returnTo', (done) => {
    run(`${API}/admin/rbac/users`, 401).subscribe({
      error: () => {
        expect(authStore.expireSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(
          ['/'],
          jasmine.objectContaining({
            queryParams: jasmine.objectContaining({
              returnTo: '/some/page',
              reason: 'session_expired',
              authRequired: '1',
            }),
          }),
        );
        done();
      },
    });
  });

  it('on 401 for /api/auth/me: does NOT redirect (anonymous probe)', (done) => {
    run(`${API}/auth/me`, 401).subscribe({
      error: () => {
        expect(authStore.expireSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('on 403: toasts the message and navigates to /forbidden', (done) => {
    run(`${API}/admin/rbac/users`, 403).subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalledWith(
          'No tienes permisos para realizar esta acción.',
        );
        expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
        done();
      },
    });
  });

  it('on a network error (status 0): shows the generic outage toast', (done) => {
    run(`${API}/admin/rbac/users`, 0).subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalledWith(
          'Estamos presentando fallas. Inténtalo nuevamente más tarde.',
        );
        done();
      },
    });
  });

  it('normalizes a non-ProblemDetails error to ProblemDetails (status-based title)', (done) => {
    run(`${API}/admin/rbac/users`, 404).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error.title).toBe('El recurso solicitado no fue encontrado.');
        expect(err.error.status).toBe(404);
        done();
      },
    });
  });

  it('silences a 400 on the suggest endpoint (no toast, no redirect)', (done) => {
    run(`${API}/public/search/suggest`, 400).subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('on a 403 LICENSE_INACTIVE: toasts but does NOT redirect to /forbidden', (done) => {
    run(`${API}/professional/services`, 403, {
      type: 'https://httpstatuses.com/403',
      title: 'Tu plan está inactivo. Reactivalo para gestionar tu información.',
      status: 403,
      errorCode: 'LICENSE_INACTIVE',
    }).subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalledWith(
          'Tu plan está inactivo. Reactivalo para gestionar tu información.',
        );
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
