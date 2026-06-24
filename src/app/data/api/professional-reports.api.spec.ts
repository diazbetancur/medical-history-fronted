import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfessionalReportsApi } from './professional-reports.api';
import type { AppointmentTrendDto } from '@data/api/api-models';

describe('ProfessionalReportsApi.getAppointmentsTrend', () => {
  let api: ProfessionalReportsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfessionalReportsApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProfessionalReportsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the trend endpoint with months param', () => {
    api.getAppointmentsTrend(6).subscribe();
    const req = httpMock.expectOne((r) => r.url.endsWith('/professional/reports/appointments-trend'));
    expect(req.request.params.get('months')).toBe('6');
    req.flush({ months: 6, points: [] } as AppointmentTrendDto);
  });
});
