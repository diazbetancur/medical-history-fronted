import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CsrfTokenStore } from '@core/auth/csrf-token.store';
import { of } from 'rxjs';
import { csrfInterceptor } from './csrf.interceptor';

const API = 'http://localhost:5254/api';
const HEADER = 'X-XSRF-TOKEN';

describe('csrfInterceptor', () => {
  let forwarded: HttpRequest<unknown> | undefined;
  const next: HttpHandlerFn = (req) => {
    forwarded = req;
    return of({} as HttpEvent<unknown>);
  };

  function configure(token: string | null): Injector {
    TestBed.configureTestingModule({
      providers: [{ provide: CsrfTokenStore, useValue: { token: () => token } }],
    });
    return TestBed.inject(Injector);
  }

  function run(
    injector: Injector,
    req: HttpRequest<unknown>,
  ): void {
    runInInjectionContext(injector, () => csrfInterceptor(req, next)).subscribe();
  }

  beforeEach(() => (forwarded = undefined));

  it('attaches the CSRF header to an unsafe API request when a token exists', () => {
    run(configure('tok-123'),new HttpRequest('POST', `${API}/admin/rbac/users`, {}));
    expect(forwarded?.headers.get(HEADER)).toBe('tok-123');
  });

  it('does not attach the header to safe methods (GET)', () => {
    run(configure('tok-123'),new HttpRequest('GET', `${API}/admin/rbac/users`));
    expect(forwarded?.headers.get(HEADER)).toBeNull();
  });

  it('does not attach the header to non-API requests', () => {
    run(configure('tok-123'),new HttpRequest('POST', 'https://other.com/thing', {}));
    expect(forwarded?.headers.get(HEADER)).toBeNull();
  });

  it('does not attach the header when there is no token', () => {
    run(configure(null),new HttpRequest('POST', `${API}/admin/rbac/users`, {}));
    expect(forwarded?.headers.get(HEADER)).toBeNull();
  });
});
