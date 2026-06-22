import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { of } from 'rxjs';
import { jwtInterceptor } from './jwt.interceptor';

const API = 'http://localhost:5254/api';

describe('jwtInterceptor', () => {
  let forwarded: HttpRequest<unknown> | undefined;
  const next: HttpHandlerFn = (req) => {
    forwarded = req;
    return of({} as HttpEvent<unknown>);
  };

  beforeEach(() => (forwarded = undefined));

  it('sets withCredentials on API requests (to send the auth cookie)', () => {
    jwtInterceptor(
      new HttpRequest('GET', `${API}/admin/rbac/users`),
      next,
    ).subscribe();

    expect(forwarded?.withCredentials).toBeTrue();
  });

  it('leaves non-API requests untouched', () => {
    jwtInterceptor(
      new HttpRequest('GET', 'https://cdn.example.com/asset.json'),
      next,
    ).subscribe();

    expect(forwarded?.withCredentials).toBeFalse();
  });
});
