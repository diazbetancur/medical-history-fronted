import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfessionalReportsApi } from './professional-reports.api';
import { environment } from '@env';
import type { AppointmentTrendDto } from '@data/api/api-models';

describe('ProfessionalReportsApi', () => {
  let api: ProfessionalReportsApi;
  let httpMock: HttpTestingController;
  const base = environment.apiBaseUrl.replace(/\/+$/, '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfessionalReportsApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProfessionalReportsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('downloadExport requests the export endpoint with the chosen format as a blob', () => {
    api.downloadExport('xlsx', 'attended', '2026-06-01', '2026-06-30').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${base}/professional/reports/appointments-export`,
    );
    expect(req.request.params.get('format')).toBe('xlsx');
    expect(req.request.params.get('type')).toBe('attended');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('from')).toBe('2026-06-01');
    expect(req.request.params.get('to')).toBe('2026-06-30');
    req.flush(new Blob());
  });

  it('getAppointmentsTrend requests the trend endpoint with months param', () => {
    api.getAppointmentsTrend(6).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/professional/reports/appointments-trend'));
    expect(req.request.params.get('months')).toBe('6');
    req.flush({ months: 6, points: [] } as AppointmentTrendDto);
  });
});
