import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminApi } from '@data/api/admin.api';
import type {
  PatientProfileClaimRequestDto,
  PatientProfileClaimStatus,
} from '@data/api/api-models';
import { ToastService } from '@shared/services';
import {
  ConfirmReasonDialogComponent,
  type ConfirmReasonDialogResult,
} from '@shared/ui';

type ClaimStatusFilter = PatientProfileClaimStatus | null;

@Component({
  selector: 'app-patient-profile-claims',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './patient-profile-claims.page.html',
  styleUrl: './patient-profile-claims.page.scss',
})
export class PatientProfileClaimsPage implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = [
    'patient',
    'document',
    'status',
    'requestedAt',
    'reviewedAt',
    'actions',
  ];
  readonly pageSizeOptions = [10, 20, 50];
  readonly statusOptions: { label: string; value: ClaimStatusFilter }[] = [
    { label: 'Todas', value: null },
    { label: 'Pendientes', value: 0 },
    { label: 'Aprobadas', value: 1 },
    { label: 'Rechazadas', value: 2 },
    { label: 'Canceladas', value: 3 },
    { label: 'Cancelación solicitada', value: 4 },
  ];

  readonly isLoading = signal(false);
  readonly savingClaimId = signal<string | null>(null);
  readonly claims = signal<PatientProfileClaimRequestDto[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly statusFilter = signal<ClaimStatusFilter>(0);
  readonly errorMessage = signal<string | null>(null);

  readonly hasClaims = computed(() => this.claims().length > 0);

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .getPatientProfileClaims({
        page: this.page(),
        pageSize: this.pageSize(),
        status: this.statusFilter(),
      })
      .subscribe({
        next: (response) => {
          this.claims.set(response.data ?? []);
          this.totalItems.set(response.pagination?.totalItems ?? 0);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.claims.set([]);
          this.totalItems.set(0);
          this.errorMessage.set(
            error?.message || 'No se pudieron cargar las solicitudes.',
          );
          this.isLoading.set(false);
        },
      });
  }

  onStatusChange(): void {
    this.page.set(1);
    this.loadClaims();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadClaims();
  }

  approveClaim(request: PatientProfileClaimRequestDto): void {
    const ref = this.dialog.open<
      ConfirmReasonDialogComponent,
      unknown,
      ConfirmReasonDialogResult | null
    >(ConfirmReasonDialogComponent, {
      width: '460px',
      data: {
        title: 'Aprobar solicitud',
        message: `¿Confirmas que deseas vincular el historial clínico de "${request.externalFullName}" a la cuenta del paciente?`,
        confirmText: 'Aprobar',
        confirmColor: 'primary',
        icon: 'check_circle',
        reasonLabel: 'Motivo de aprobación',
        reasonDefault: 'Documento validado por administración',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result === null || result === undefined) return;

      this.savingClaimId.set(request.id);
      this.adminApi
        .approvePatientProfileClaim(request.id, { reason: result.reason })
        .subscribe({
          next: (updated) => {
            this.replaceClaim(updated);
            this.savingClaimId.set(null);
            this.toast.success('Historial vinculado al paciente.');
          },
          error: (error) => {
            this.savingClaimId.set(null);
            const msg = error?.error?.detail || error?.message;
            this.toast.error(msg || 'No se pudo aprobar la solicitud.');
            this.loadClaims();
          },
        });
    });
  }

  rejectClaim(request: PatientProfileClaimRequestDto): void {
    const ref = this.dialog.open<
      ConfirmReasonDialogComponent,
      unknown,
      ConfirmReasonDialogResult | null
    >(ConfirmReasonDialogComponent, {
      width: '460px',
      data: {
        title: 'Rechazar solicitud',
        message: `¿Confirmas que deseas rechazar la solicitud de vinculación de "${request.externalFullName}"?`,
        confirmText: 'Rechazar',
        confirmColor: 'warn',
        icon: 'cancel',
        reasonLabel: 'Motivo del rechazo',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result === null || result === undefined) return;

      this.savingClaimId.set(request.id);
      this.adminApi
        .rejectPatientProfileClaim(request.id, { reason: result.reason })
        .subscribe({
          next: (updated) => {
            this.replaceClaim(updated);
            this.savingClaimId.set(null);
            this.toast.warning('Solicitud rechazada.');
          },
          error: (error) => {
            this.savingClaimId.set(null);
            const msg = error?.error?.detail || error?.message;
            this.toast.error(msg || 'No se pudo rechazar la solicitud.');
            this.loadClaims();
          },
        });
    });
  }

  completeCancellation(request: PatientProfileClaimRequestDto): void {
    const ref = this.dialog.open<
      ConfirmReasonDialogComponent,
      unknown,
      ConfirmReasonDialogResult | null
    >(ConfirmReasonDialogComponent, {
      width: '460px',
      data: {
        title: 'Completar cancelación',
        message: `¿Confirmas que deseas completar la cancelación solicitada por "${request.externalFullName}"?`,
        confirmText: 'Completar',
        confirmColor: 'primary',
        icon: 'task_alt',
        reasonLabel: 'Motivo',
        reasonDefault: request.cancellationReason || '',
      },
    });

    ref.afterClosed().subscribe((result) => {
      if (result === null || result === undefined) return;

      this.savingClaimId.set(request.id);
      this.adminApi
        .completePatientProfileClaimCancellation(request.id, { reason: result.reason })
        .subscribe({
          next: (updated) => {
            this.replaceClaim(updated);
            this.savingClaimId.set(null);
            this.toast.success('Cancelación completada.');
          },
          error: (error) => {
            this.savingClaimId.set(null);
            const msg = error?.error?.detail || error?.message;
            this.toast.error(msg || 'No se pudo completar la cancelación.');
            this.loadClaims();
          },
        });
    });
  }

  claimStatusLabel(status: PatientProfileClaimStatus): string {
    switch (status) {
      case 0:
      case 'Pending':
        return 'Pendiente';
      case 1:
      case 'Approved':
        return 'Aprobada';
      case 2:
      case 'Rejected':
        return 'Rechazada';
      case 3:
      case 'Cancelled':
        return 'Cancelada';
      case 4:
      case 'CancellationRequested':
        return 'Cancelación solicitada';
      default:
        return 'Sin estado';
    }
  }

  canApprove(request: PatientProfileClaimRequestDto): boolean {
    return request.status === 0 || request.status === 'Pending';
  }

  canCompleteCancellation(request: PatientProfileClaimRequestDto): boolean {
    return request.status === 4 || request.status === 'CancellationRequested';
  }

  isSaving(request: PatientProfileClaimRequestDto): boolean {
    return this.savingClaimId() === request.id;
  }

  getDocumentLabel(request: PatientProfileClaimRequestDto): string {
    const type = request.documentType?.trim() || 'Documento';
    const number = request.documentNumber?.trim();
    return number ? `${type} ${number}` : type;
  }

  private replaceClaim(updated: PatientProfileClaimRequestDto): void {
    this.claims.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

}
