import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ToastService } from '@shared/services';
import {
  MSG_EXAM_CREATED,
  MSG_EXAM_DELETED,
  MSG_EXAM_ERROR_CREATE,
  MSG_EXAM_ERROR_LOAD,
} from '@shared/constants/messages.constants';
import type {
  CreateExamRequest,
  PaginatedExamsResponse,
  PatientExamDto,
} from '../models/patient-exam.dto';
import { PatientExamsService } from '../services/patient-exams.service';
import { PatientExamsStore } from './patient-exams.store';

function makeExam(id = 'e1'): PatientExamDto {
  return {
    id,
    patientId: '',
    title: 'Hemograma',
    examDate: '2026-06-10',
    notes: undefined,
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    attachments: [
      {
        id,
        examId: id,
        originalFileName: 'h.pdf',
        fileSize: 10,
        mimeType: 'application/pdf',
        uploadedAt: '2026-06-10T00:00:00Z',
      },
    ],
  };
}

function makePage(
  items: PatientExamDto[],
  total: number,
): PaginatedExamsResponse {
  return { items, total, page: 1, pageSize: 10, totalPages: Math.ceil(total / 10) };
}

describe('PatientExamsStore', () => {
  let store: PatientExamsStore;
  let service: jasmine.SpyObj<PatientExamsService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<PatientExamsService>('PatientExamsService', [
      'list',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    toast = jasmine.createSpyObj<ToastService>('ToastService', [
      'success',
      'error',
      'warning',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PatientExamsStore,
        { provide: PatientExamsService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    store = TestBed.inject(PatientExamsStore);
  });

  it('is empty before any load', () => {
    expect(store.isEmpty()).toBeTrue();
    expect(store.hasExams()).toBeFalse();
  });

  it('loadExams populates signals and stops loading', () => {
    service.list.and.returnValue(of(makePage([makeExam()], 1)));

    store.loadExams(1, 10);

    expect(service.list).toHaveBeenCalledOnceWith(1, 10);
    expect(store.exams().length).toBe(1);
    expect(store.total()).toBe(1);
    expect(store.totalPages()).toBe(1);
    expect(store.hasExams()).toBeTrue();
    expect(store.loading()).toBeFalse();
  });

  it('serves the second identical load from cache (no extra service call)', () => {
    service.list.and.returnValue(of(makePage([makeExam()], 1)));

    store.loadExams(1, 10);
    store.loadExams(1, 10);

    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('loadExams surfaces the backend message and a toast on error', () => {
    service.list.and.returnValue(
      throwError(() => ({ error: { message: 'boom' } })),
    );

    store.loadExams(1, 10);

    expect(store.error()).toBe('boom');
    expect(toast.error).toHaveBeenCalledWith(MSG_EXAM_ERROR_LOAD);
    expect(store.loading()).toBeFalse();
  });

  it('createExam toasts success, reloads, and resolves the exam', async () => {
    const exam = makeExam();
    service.create.and.returnValue(of(exam));
    service.list.and.returnValue(of(makePage([exam], 1)));

    const result = await store.createExam(
      { title: 'Hemograma' } as CreateExamRequest,
      new File([], 'h.pdf'),
    );

    expect(result).toEqual(exam);
    expect(toast.success).toHaveBeenCalledWith(MSG_EXAM_CREATED);
    // cache was cleared and the current page reloaded
    expect(service.list).toHaveBeenCalled();
  });

  it('createExam toasts the backend message and resolves null on error', async () => {
    service.create.and.returnValue(
      throwError(() => ({ error: { message: 'rechazado' } })),
    );

    const result = await store.createExam(
      { title: 'Hemograma' } as CreateExamRequest,
      new File([], 'h.pdf'),
    );

    expect(result).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('rechazado');
  });

  it('createExam falls back to the generic message when none is provided', async () => {
    service.create.and.returnValue(throwError(() => ({})));

    await store.createExam(
      { title: 'Hemograma' } as CreateExamRequest,
      new File([], 'h.pdf'),
    );

    expect(toast.error).toHaveBeenCalledWith(MSG_EXAM_ERROR_CREATE);
  });

  it('deleteExam toasts success and resolves true', async () => {
    service.delete.and.returnValue(of(undefined));
    service.list.and.returnValue(of(makePage([], 0)));

    const ok = await store.deleteExam('e1');

    expect(ok).toBeTrue();
    expect(toast.success).toHaveBeenCalledWith(MSG_EXAM_DELETED);
  });

  it('reset clears state and cache', () => {
    service.list.and.returnValue(of(makePage([makeExam()], 1)));
    store.loadExams(1, 10);

    store.reset();

    expect(store.exams()).toEqual([]);
    expect(store.total()).toBe(0);
    // cache cleared -> a subsequent load hits the service again
    store.loadExams(1, 10);
    expect(service.list).toHaveBeenCalledTimes(2);
  });
});
