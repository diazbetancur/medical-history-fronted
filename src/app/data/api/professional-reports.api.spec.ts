import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfessionalReportsApi } from './professional-reports.api';
import { environment } from '@env';

describe('ProfessionalReportsApi.downloadExport', () => {
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

  it('requests the export endpoint with the chosen format as a blob', () => {
    api.downloadExport('xlsx', 'attended', '2026-06-01', '2026-06-30').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${base}/professional/reports/appointments-export`,
    );
    expect(req.request.params.get('format')).toBe('xlsx');
    expect(req.request.params.get('type')).toBe('attended');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
