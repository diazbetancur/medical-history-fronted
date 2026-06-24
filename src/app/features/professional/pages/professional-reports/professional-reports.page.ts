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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import type {
  AppointmentReportDetailItemDto,
  AppointmentReportSummaryDto,
  AppointmentTrendPointDto,
  ReportType,
} from '@data/api/api-models';
import { ProfessionalReportsApi } from '@data/api/professional-reports.api';
import { finalize } from 'rxjs';
import { AppointmentsTrendChartComponent } from './appointments-trend-chart.component';

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
    MatTabsModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    AppointmentsTrendChartComponent,
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
  readonly selectedTabIndex = signal(0);
  readonly detailLoaded = signal(false);

  readonly isDownloading = signal(false);

  readonly trendMonths = signal(6);
  readonly trendLoading = signal(false);
  readonly trendPoints = signal<AppointmentTrendPointDto[]>([]);

  loadTrend(): void {
    if (this.trendPoints().length || this.trendLoading()) return;
    this.trendLoading.set(true);
    this.api
      .getAppointmentsTrend(this.trendMonths())
      .pipe(finalize(() => this.trendLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.trendPoints.set(data.points),
        error: () => this.trendPoints.set([]),
      });
  }

  readonly displayedColumns = ['patientName', 'documentType', 'documentNumber', 'gender', 'appointmentDate', 'timeSlot', 'status'];

  readonly cards: ReportCard[] = [
    { type: 'attended', label: 'Atendidos', icon: 'check_circle', count: () => this.summary()?.attendedCount ?? 0 },
    { type: 'confirmed', label: 'Confirmados', icon: 'event_available', count: () => this.summary()?.confirmedCount ?? 0 },
    { type: 'cancelled', label: 'Cancelados', icon: 'cancel', count: () => this.summary()?.cancelledCount ?? 0 },
    { type: 'noShow', label: 'No presentados', icon: 'person_off', count: () => this.summary()?.noShowCount ?? 0 },
  ];

  ngOnInit(): void {
    this.loadSummary();
  }

  resetToCurrentMonth(): void {
    this.fromDate.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.toDate.set(new Date());
    this.rangeError.set(null);
    this.detailPage.set(0);
    this.refreshAfterFilterChange();
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
    this.detailLoaded.set(false);
    this.selectedTabIndex.set(2); // → pestaña Detalle; onTabChange dispara la carga
  }

  // Cambio de tipo desde los chips dentro de la pestaña Detalle (sin cambiar de pestaña)
  selectType(type: ReportType | null): void {
    if (!type) return; // evita "deseleccionar" el chip
    this.selectedType.set(type);
    this.detailPage.set(0);
    this.loadDetail();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index === 1) {
      this.loadTrend();
    } else if (index === 2 && !this.detailLoaded()) {
      this.loadDetail();
    }
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
    this.refreshAfterFilterChange();
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

  private refreshAfterFilterChange(): void {
    this.loadSummary();
    this.detailLoaded.set(false);
    this.detailItems.set([]);
    if (this.selectedTabIndex() === 2) {
      this.loadDetail();
    }
  }

  private loadDetail(): void {
    if (this.rangeError()) return;
    this.detailLoaded.set(true);

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

  cardDelta(type: ReportType): number | null {
    const c = this.summary()?.comparison;
    if (!c) return null;
    switch (type) {
      case 'attended': return c.attendedDeltaPct;
      case 'confirmed': return c.confirmedDeltaPct;
      case 'cancelled': return c.cancelledDeltaPct;
      case 'noShow': return c.noShowDeltaPct;
    }
  }

  // 'up' = increase, 'down' = decrease, 'flat' = 0, null = no baseline
  deltaDirection(type: ReportType): 'up' | 'down' | 'flat' | null {
    const d = this.cardDelta(type);
    if (d === null || d === undefined) return null;
    if (d > 0) return 'up';
    if (d < 0) return 'down';
    return 'flat';
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
