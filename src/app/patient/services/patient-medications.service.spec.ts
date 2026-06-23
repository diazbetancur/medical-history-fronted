import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env';
import type {
  CreateMedicationDto,
  UpdateMedicationDto,
} from '@data/models';
import { PatientMedicationsService } from './patient-medications.service';

describe('PatientMedicationsService', () => {
  let service: PatientMedicationsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/patient/medications`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatientMedicationsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PatientMedicationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('update() sends status and isOngoing in the PUT body (regression: they were dropped)', () => {
    const dto: UpdateMedicationDto = {
      name: 'Ibuprofeno',
      isOngoing: false,
      endDate: '2026-06-22',
      status: 'Stopped',
    };

    service.update('m1', dto).subscribe();

    const req = httpMock.expectOne(`${base}/m1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.status).toBe('Stopped');
    expect(req.request.body.isOngoing).toBe(false);
    req.flush({ id: 'm1', status: 'Stopped', isOngoing: false });
  });

  it('create() sends status and isOngoing in the POST body', () => {
    const dto: CreateMedicationDto = {
      name: 'Ibuprofeno',
      isOngoing: true,
      status: 'Active',
    };

    service.create(dto).subscribe();

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.status).toBe('Active');
    expect(req.request.body.isOngoing).toBe(true);
    req.flush({ id: 'm1', status: 'Active', isOngoing: true });
  });
});
