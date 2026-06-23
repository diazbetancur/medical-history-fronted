import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminUsersApi } from './admin-users.api';
import type { AdminApiError } from './admin-users.types';
import { ApiClient } from './api-client';

describe('AdminUsersApi', () => {
  let apiService: AdminUsersApi;
  let api: jasmine.SpyObj<ApiClient>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'get',
      'post',
      'patch',
      'delete',
    ]);
    TestBed.configureTestingModule({
      providers: [AdminUsersApi, { provide: ApiClient, useValue: api }],
    });
    apiService = TestBed.inject(AdminUsersApi);
  });

  describe('listUsers pagination normalization', () => {
    it('normalizes Format A (items + totalCount) and infers hasPrevious/hasNext', (done) => {
      api.get.and.returnValue(
        of({
          items: [{ id: 'u1' }],
          page: 2,
          pageSize: 10,
          totalCount: 25,
          totalPages: 3,
        }) as any,
      );

      apiService.listUsers({ page: 2, pageSize: 10 }).subscribe((res) => {
        expect(res.data).toEqual([{ id: 'u1' }] as any);
        expect(res.pagination).toEqual({
          currentPage: 2,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
          hasPrevious: true,
          hasNext: true,
        });
        done();
      });
    });

    it('normalizes Format B (data + pagination object)', (done) => {
      api.get.and.returnValue(
        of({
          data: [{ id: 'u2' }],
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalItems: 5,
            totalPages: 1,
          },
        }) as any,
      );

      apiService.listUsers().subscribe((res) => {
        expect(res.data).toEqual([{ id: 'u2' }] as any);
        expect(res.pagination.hasPrevious).toBeFalse();
        expect(res.pagination.hasNext).toBeFalse();
        expect(res.pagination.totalItems).toBe(5);
        done();
      });
    });

    it('falls back to a single page when the response is a bare array', (done) => {
      api.get.and.returnValue(of([{ id: 'u3' }, { id: 'u4' }]) as any);

      apiService.listUsers({ page: 1, pageSize: 10 }).subscribe((res) => {
        expect(res.data.length).toBe(2);
        expect(res.pagination.totalItems).toBe(2);
        expect(res.pagination.totalPages).toBe(1);
        expect(res.pagination.hasNext).toBeFalse();
        done();
      });
    });

    it('returns empty data with default pagination for an unknown shape', (done) => {
      api.get.and.returnValue(of({ foo: 'bar' }) as any);

      apiService.listUsers({ page: 3, pageSize: 25 }).subscribe((res) => {
        expect(res.data).toEqual([]);
        expect(res.pagination.currentPage).toBe(3);
        expect(res.pagination.pageSize).toBe(25);
        expect(res.pagination.totalItems).toBe(0);
        expect(res.pagination.totalPages).toBe(0);
        done();
      });
    });
  });

  describe('buildQueryParams (via listUsers)', () => {
    it('trims q, drops non-positive page/pageSize, and keeps defined booleans', () => {
      api.get.and.returnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }) as any);

      apiService
        .listUsers({
          q: '  juan  ',
          page: 2,
          pageSize: 0, // non-positive -> dropped
          sortBy: 'userName',
          isLockedOut: false, // defined -> kept
        })
        .subscribe();

      const [endpoint, options] = api.get.calls.mostRecent().args as [
        string,
        { params: Record<string, unknown> },
      ];
      expect(endpoint).toBe('/admin/rbac/users');
      expect(options.params).toEqual({
        q: 'juan',
        page: 2,
        sortBy: 'userName',
        isLockedOut: false,
      });
    });
  });

  describe('write operations', () => {
    it('createUser POSTs to the base path with the dto', () => {
      api.post.and.returnValue(of({ userId: 'new' }) as any);

      apiService.createUser({ username: 'a' } as any).subscribe();

      expect(api.post).toHaveBeenCalledWith('/admin/rbac/users', {
        username: 'a',
      } as any);
    });

    it('updateUser PATCHes the user path with the dto', () => {
      api.patch.and.returnValue(of({ userId: 'u1' }) as any);

      apiService.updateUser('u1', { email: 'x@y.z' } as any).subscribe();

      expect(api.patch).toHaveBeenCalledWith('/admin/rbac/users/u1', {
        email: 'x@y.z',
      } as any);
    });

    it('deleteUser DELETEs the user path', () => {
      api.delete.and.returnValue(of({ deleted: true }) as any);

      apiService.deleteUser('u1').subscribe();

      expect(api.delete).toHaveBeenCalledWith('/admin/rbac/users/u1');
    });

    it('maps errors from write operations through parseError', (done) => {
      api.post.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Datos inválidos' },
            }),
        ),
      );

      apiService.createUser({ username: '' } as any).subscribe({
        next: () => fail('expected an error'),
        error: (err: AdminApiError) => {
          expect(err.status).toBe(400);
          expect(err.code).toBe('BAD_REQUEST');
          expect(err.message).toBe('Datos inválidos');
          done();
        },
      });
    });
  });

  describe('error mapping', () => {
    it('maps a simple error body to an AdminApiError with a status-derived code', (done) => {
      api.get.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: 'El usuario no existe' },
            }),
        ),
      );

      apiService.getUser('missing').subscribe({
        next: () => fail('expected an error'),
        error: (err: AdminApiError) => {
          expect(err.status).toBe(404);
          expect(err.code).toBe('NOT_FOUND');
          expect(err.message).toBe('El usuario no existe');
          done();
        },
      });
    });

    it('maps an RFC7807 ProblemDetails body using its title and status', (done) => {
      api.get.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { title: 'Conflicto', status: 409, detail: 'duplicado' },
            }),
        ),
      );

      apiService.getUser('dup').subscribe({
        next: () => fail('expected an error'),
        error: (err: AdminApiError) => {
          expect(err.status).toBe(409);
          expect(err.code).toBe('CONFLICT');
          expect(err.message).toBe('Conflicto');
          expect(err.details).toBe('duplicado');
          done();
        },
      });
    });
  });
});
