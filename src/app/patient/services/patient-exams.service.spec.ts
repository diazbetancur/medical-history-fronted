import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '@data/api';
import { PatientExamsService } from './patient-exams.service';

describe('PatientExamsService', () => {
  let service: PatientExamsService;
  let api: jasmine.SpyObj<ApiClient>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'get',
      'postMultipart',
      'put',
      'delete',
      'buildUrl',
    ]);
    TestBed.configureTestingModule({
      providers: [
        PatientExamsService,
        { provide: ApiClient, useValue: api },
      ],
    });
    service = TestBed.inject(PatientExamsService);
  });

  it('maps the paginated list using the backend "total" field and derives PDF mime by extension', (done) => {
    api.get.and.returnValue(
      of({
        items: [
          {
            id: 'e1',
            title: 'Hemograma',
            examDate: '2026-06-10',
            originalFileName: 'hemograma.PDF',
            fileSizeBytes: 1234,
            createdAtUtc: '2026-06-10T12:00:00Z',
          },
        ],
        page: 1,
        pageSize: 10,
        total: 7,
      }) as any,
    );

    service.list(1, 10).subscribe((res) => {
      expect(res.total).toBe(7);
      expect(res.totalPages).toBe(1);
      expect(res.items.length).toBe(1);
      // List items have no contentType → mime inferred from the .pdf extension.
      expect(res.items[0].attachments[0].mimeType).toBe('application/pdf');
      expect(res.items[0].createdAt).toBe('2026-06-10T12:00:00Z');
      done();
    });
  });

  it('maps exam detail: mime from contentType, timestamps from createdAtUtc/updatedAtUtc', (done) => {
    api.get.and.returnValue(
      of({
        id: 'e2',
        title: 'Rayos X',
        examDate: '2026-06-11',
        notes: 'control',
        originalFileName: 'scan-without-extension',
        contentType: 'image/png',
        fileSizeBytes: 99,
        isActive: true,
        createdAtUtc: '2026-06-11T08:00:00Z',
        updatedAtUtc: '2026-06-11T09:00:00Z',
      }) as any,
    );

    service.getById('e2').subscribe((exam) => {
      expect(exam.createdAt).toBe('2026-06-11T08:00:00Z');
      expect(exam.updatedAt).toBe('2026-06-11T09:00:00Z');
      expect(exam.notes).toBe('control');
      expect(exam.attachments[0].mimeType).toBe('image/png');
      expect(exam.attachments[0].fileSize).toBe(99);
      done();
    });
  });
});
