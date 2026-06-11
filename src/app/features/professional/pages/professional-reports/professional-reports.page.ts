import { DatePipe, LowerCasePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type {
  AppointmentReportDetailItemDto,
  AppointmentReportSummaryDto,
  ReportType,
} from '@data/api/api-models';
import { ProfessionalReportsApi } from '@data/api/professional-reports.api';
import { finalize } from 'rxjs';

interface ReportCard {
  type: ReportType;
  label: string;
  icon: string;
  count: () => number;
}

@Component({
  selector: 'app-professional-reports-page',
  standalone: true,
  imports: [
    DatePipe,
    LowerCasePipe,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './professional-reports.page.html',
  styleUrl: './professional-reports.page.scss',
})
export class ProfessionalReportsPage implements OnInit {
  private readonly api = inject(ProfessionalReportsApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = new Date();
  readonly maxDate = new Date();
  readonly minDetailDate = new Date(
    this.today.getFullYear(),
    this.today.getMonth() - 3,
    1,
  );

  readonly fromDate = signal<Date>(
    new Date(this.today.getFullYear(), this.today.getMonth(), 1),
  );
  readonly toDate = signal<Date>(new Date());

  readonly rangeError = signal<string | null>(null);

  readonly summaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);
  readonly summary = signal<AppointmentReportSummaryDto | null>(null);

  readonly selectedType = signal<ReportType>('attended');

  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly detailItems = signal<AppointmentReportDetailItemDto[]>([]);
  readonly detailTotal = signal(0);
  readonly detailPage = signal(0);
  readonly detailPageSize = signal(20);

  readonly isDownloading = signal(false);

  readonly displayedColumns = ['patientName', 'documentType', 'documentNumber', 'gender', 'appointmentDate', 'timeSlot', 'status'];

  readonly cards: ReportCard[] = [
    { type: 'attended', label: 'Atendidos', icon: 'check_circle', count: () => this.summary()?.attendedCount ?? 0 },
    { type: 'confirmed', label: 'Confirmados', icon: 'event_available', count: () => this.summary()?.confirmedCount ?? 0 },
    { type: 'cancelled', label: 'Cancelados', icon: 'cancel', count: () => this.summary()?.cancelledCount ?? 0 },
    { type: 'noShow', label: 'No presentados', icon: 'person_off', count: () => this.summary()?.noShowCount ?? 0 },
  ];

  ngOnInit(): void {
    this.loadSummary();
    this.loadDetail();
  }

  resetToCurrentMonth(): void {
    this.fromDate.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.toDate.set(new Date());
    this.rangeError.set(null);
    this.detailPage.set(0);
    this.loadSummary();
    this.loadDetail();
  }

  onFromChange(date: Date | null): void {
    if (!date) return;
    this.fromDate.set(date);
    this.validateAndApply();
  }

  onToChange(date: Date | null): void {
    if (!date) return;
    this.toDate.set(date);
    this.validateAndApply();
  }

  selectCard(type: ReportType): void {
    this.selectedType.set(type);
    this.detailPage.set(0);
    this.loadDetail();
  }

  onPageChange(event: PageEvent): void {
    this.detailPage.set(event.pageIndex);
    this.detailPageSize.set(event.pageSize);
    this.loadDetail();
  }

  selectedCardLabel(): string {
    return this.cards.find((c) => c.type === this.selectedType())?.label ?? '';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      Completed: 'Atendido',
      Confirmed: 'Confirmado',
      Cancelled: 'Cancelado',
      NoShow: 'No presentado',
      Pending: 'Pendiente',
    };
    return map[status] ?? status;
  }

  private validateAndApply(): void {
    const from = this.fromDate();
    const to = this.toDate();

    if (from > to) {
      this.rangeError.set('La fecha de inicio no puede ser mayor a la de fin');
      return;
    }

    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      this.rangeError.set('El rango máximo permitido es 90 días');
      return;
    }

    this.rangeError.set(null);
    this.detailPage.set(0);
    this.loadSummary();
    this.loadDetail();
  }

  downloadCsv(): void {
    this.isDownloading.set(true);
    this.api
      .downloadCsv(this.selectedType(), this.formatDate(this.fromDate()), this.formatDate(this.toDate()))
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte-${this.selectedType()}-${this.formatDate(this.fromDate())}-${this.formatDate(this.toDate())}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.detailError.set('No se pudo generar el archivo CSV');
        },
      });
  }

  private loadSummary(): void {
    if (this.rangeError()) return;

    this.summaryLoading.set(true);
    this.summaryError.set(null);

    this.api
      .getAppointmentsSummary(this.formatDate(this.fromDate()), this.formatDate(this.toDate()))
      .pipe(
        finalize(() => this.summaryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.summary.set(data),
        error: (err) => {
          const msg = err?.error?.detail || err?.message;
          this.summaryError.set(msg || 'Error al cargar el resumen');
        },
      });
  }

  private loadDetail(): void {
    if (this.rangeError()) return;

    this.detailLoading.set(true);
    this.detailError.set(null);

    this.api
      .getAppointmentsDetail({
        type: this.selectedType(),
        from: this.formatDate(this.fromDate()),
        to: this.formatDate(this.toDate()),
        page: this.detailPage() + 1,
        pageSize: this.detailPageSize(),
      })
      .pipe(
        finalize(() => this.detailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.detailItems.set(data.items);
          this.detailTotal.set(data.totalCount);
        },
        error: (err) => {
          const msg = err?.error?.detail || err?.message;
          this.detailError.set(msg || 'Error al cargar el detalle');
        },
      });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
