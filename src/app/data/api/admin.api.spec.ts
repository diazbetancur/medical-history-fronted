import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminApi } from './admin.api';
import { ApiClient } from './api-client';

describe('AdminApi', () => {
  let admin: AdminApi;
  let api: jasmine.SpyObj<ApiClient>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiClient>('ApiClient', ['get']);
    api.get.and.returnValue(of({}) as any);
    TestBed.configureTestingModule({
      providers: [AdminApi, { provide: ApiClient, useValue: api }],
    });
    admin = TestBed.inject(AdminApi);
  });

  function lastEndpoint(): string {
    return api.get.calls.mostRecent().args[0] as string;
  }

  describe('getProfessionals query building', () => {
    it('omits the query string entirely when no filters are given', () => {
      admin.getProfessionals().subscribe();
      expect(lastEndpoint()).toBe('/admin/professionals');
    });

    it('drops default/sentinel values (status "all", orderBy "dateCreated", page 1, pageSize 20)', () => {
      admin
        .getProfessionals({
          status: 'all',
          orderBy: 'dateCreated',
          page: 1,
          pageSize: 20,
          countryId: 'c1',
          q: 'ana',
        })
        .subscribe();
      expect(lastEndpoint()).toBe('/admin/professionals?countryId=c1&q=ana');
    });

    it('includes non-default values', () => {
      admin
        .getProfessionals({
          status: 'pending',
          orderBy: 'businessName',
          page: 2,
          pageSize: 50,
        })
        .subscribe();
      expect(lastEndpoint()).toBe(
        '/admin/professionals?status=pending&orderBy=businessName&page=2&pageSize=50',
      );
    });
  });

  describe('getRequests query building', () => {
    it('omits the query string when no filters are given', () => {
      admin.getRequests().subscribe();
      expect(lastEndpoint()).toBe('/admin/requests');
    });

    it('includes page (>1), non-default pageSize, status and date range', () => {
      admin
        .getRequests({
          page: 3,
          pageSize: 50,
          status: 'Pending',
          from: '2026-06-01',
          to: '2026-06-30',
        })
        .subscribe();
      expect(lastEndpoint()).toBe(
        '/admin/requests?page=3&pageSize=50&status=Pending&from=2026-06-01&to=2026-06-30',
      );
    });
  });

  describe('getProfessionalSpecialties', () => {
    it('unwraps the specialties array from the response', (done) => {
      api.get.and.returnValue(of({ specialties: [{ id: 's1' }] }) as any);
      admin.getProfessionalSpecialties('p1').subscribe((list) => {
        expect(list).toEqual([{ id: 's1' }] as any);
        done();
      });
    });

    it('returns an empty array when the response has no specialties', (done) => {
      api.get.and.returnValue(of({}) as any);
      admin.getProfessionalSpecialties('p1').subscribe((list) => {
        expect(list).toEqual([]);
        done();
      });
    });
  });
});
