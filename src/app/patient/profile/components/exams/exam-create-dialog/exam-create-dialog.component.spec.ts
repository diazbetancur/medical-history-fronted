import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { PatientExamDto } from '../../../../models/patient-exam.dto';
import { PatientExamsStore } from '../../../../stores/patient-exams.store';
import { ExamCreateDialogComponent } from './exam-create-dialog.component';

function makeExam(): PatientExamDto {
  return {
    id: 'e1',
    patientId: '',
    title: 'Hemograma',
    examDate: '2026-06-10',
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    attachments: [],
  };
}

describe('ExamCreateDialogComponent', () => {
  let component: ExamCreateDialogComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ExamCreateDialogComponent>>;
  let store: jasmine.SpyObj<PatientExamsStore>;

  beforeEach(() => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<ExamCreateDialogComponent>>(
      'MatDialogRef',
      ['close'],
    );
    store = jasmine.createSpyObj<PatientExamsStore>('PatientExamsStore', [
      'createExam',
    ]);

    TestBed.configureTestingModule({
      imports: [ExamCreateDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: PatientExamsStore, useValue: store },
      ],
    });

    component = TestBed.createComponent(ExamCreateDialogComponent).componentInstance;
  });

  function fillValidForm(): void {
    // examDate holds a Date at runtime (mat-datepicker); the control is typed
    // string from its initial value, hence the cast.
    component.form.setValue({
      title: '  Hemograma  ',
      category: 'LABORATORIO',
      examDate: new Date(2026, 5, 10), // June 10 2026, local time
      notes: '  control  ',
    } as any);
    component.selectedFile = new File([], 'h.pdf');
  }

  it('does not submit when the form is invalid', async () => {
    component.selectedFile = new File([], 'h.pdf'); // file present, but title/date missing
    await component.create();
    expect(store.createExam).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('does not submit when no file is selected', async () => {
    component.form.setValue({
      title: 'Hemograma',
      category: '',
      examDate: new Date(2026, 5, 10),
      notes: '',
    } as any);
    component.selectedFile = null;

    await component.create();
    expect(store.createExam).not.toHaveBeenCalled();
  });

  it('submits a trimmed, locally-formatted request and closes on success', async () => {
    store.createExam.and.resolveTo(makeExam());
    fillValidForm();

    await component.create();

    expect(store.createExam).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Hemograma',
        category: 'LABORATORIO',
        examDate: '2026-06-10', // local date parts, no UTC off-by-one
        notes: 'control',
      }),
      jasmine.any(File),
    );
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.creating()).toBeFalse();
  });

  it('keeps the dialog open and resets the loader when creation fails', async () => {
    store.createExam.and.resolveTo(null);
    fillValidForm();

    await component.create();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.creating()).toBeFalse();
  });
});
