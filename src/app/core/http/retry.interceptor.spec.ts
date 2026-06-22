import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { retryInterceptor } from './retry.interceptor';

const URL = 'http://localhost:5254/api/something';

function failingNext(status: number): {
  handler: HttpHandlerFn;
  calls: () => number;
} {
  let count = 0;
  const handler: HttpHandlerFn = () => {
    count++;
    return throwError(() => new HttpErrorResponse({ status }));
  };
  return { handler, calls: () => count };
}

/**
 * The interceptor's decision logic is verified synchronously: a request that is
 * NOT retried propagates its error immediately (errored === true right after
 * subscribe), whereas a request that IS retried defers the error behind a
 * backoff timer (errored === false right after subscribe, first attempt made).
 * The exact retry count / backoff duration is timer-driven and not asserted.
 */
describe('retryInterceptor', () => {
  it('does not retry non-idempotent methods (POST): error propagates immediately', () => {
    const next = failingNext(500);
    let errored = false;

    const sub = retryInterceptor(
      new HttpRequest('POST', URL, {}),
      next.handler,
    ).subscribe({ error: () => (errored = true) });

    expect(next.calls()).toBe(1);
    expect(errored).toBeTrue();
    sub.unsubscribe();
  });

  it('does not retry a GET on a deterministic 4xx: error propagates immediately', () => {
    const next = failingNext(400);
    let errored = false;

    const sub = retryInterceptor(
      new HttpRequest('GET', URL),
      next.handler,
    ).subscribe({ error: () => (errored = true) });

    expect(next.calls()).toBe(1);
    expect(errored).toBeTrue();
    sub.unsubscribe();
  });

  it('engages retry for a GET on a transient 5xx: error is deferred behind backoff', () => {
    const next = failingNext(503);
    let errored = false;

    const sub = retryInterceptor(
      new HttpRequest('GET', URL),
      next.handler,
    ).subscribe({ error: () => (errored = true) });

    expect(next.calls()).toBe(1); // first attempt made
    expect(errored).toBeFalse(); // not given up yet — retry pending
    sub.unsubscribe(); // cancel the pending backoff timer
  });

  it('engages retry for a GET on a network error (status 0)', () => {
    const next = failingNext(0);
    let errored = false;

    const sub = retryInterceptor(
      new HttpRequest('GET', URL),
      next.handler,
    ).subscribe({ error: () => (errored = true) });

    expect(errored).toBeFalse();
    sub.unsubscribe();
  });
});
