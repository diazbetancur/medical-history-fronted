import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { PatientClinicalAccessRequestDto } from '../../../features/professional/services/professional-patients.service';
import { PatientAccessRequestsService } from '../../services/patient-access-requests.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-patient-access-requests',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './patient-access-requests.page.html',
  styleUrl: './patient-access-requests.page.scss',
})
export class PatientAccessRequestsPage implements OnInit {
  private readonly accessRequestsService = inject(PatientAccessRequestsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(true);
  readonly respondingRequestId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly requests = signal<PatientClinicalAccessRequestDto[]>([]);
  readonly pendingCount = computed(
    () => this.requests().filter((item) => item.status === 'Pending').length,
  );
  readonly activeAccessCount = computed(
    () => this.requests().filter((item) => item.status === 'Approved').length,
  );

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.accessRequestsService
      .listMine()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (requests) => this.requests.set(requests),
        error: (error) => {
          this.error.set(error.message || 'No se pudieron cargar las solicitudes');
        },
      });
  }

  approve(request: PatientClinicalAccessRequestDto): void {
    this.respond(request.id, 'approve');
  }

  reject(request: PatientClinicalAccessRequestDto): void {
    this.respond(request.id, 'reject');
  }

  revoke(request: PatientClinicalAccessRequestDto): void {
    if (this.respondingRequestId()) {
      return;
    }

    this.respondingRequestId.set(this.getActionKey(request));
    this.accessRequestsService
      .revokeProfessional(request.professionalProfileId)
      .pipe(finalize(() => this.respondingRequestId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Acceso revocado', 'OK', { duration: 3000 });
          this.loadRequests();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'No se pudo revocar el acceso',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  canRevoke(request: PatientClinicalAccessRequestDto): boolean {
    return request.status === 'Approved' && request.canRevoke !== false;
  }

  isResponding(request: PatientClinicalAccessRequestDto): boolean {
    return this.respondingRequestId() === this.getActionKey(request);
  }

  trackAccess(
    _index: number,
    request: PatientClinicalAccessRequestDto,
  ): string {
    return `${request.accessSource || 'Request'}-${request.id}-${request.professionalProfileId}`;
  }

  getAccessSourceLabel(request: PatientClinicalAccessRequestDto): string {
    return request.accessSource === 'Relationship'
      ? 'Acceso por cita médica'
      : 'Solicitud de acceso';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Approved':
        return 'Aceptada';
      case 'Rejected':
        return 'Rechazada';
      case 'Expired':
        return 'Expirada';
      case 'Revoked':
        return 'Revocada';
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Pending':
        return 'schedule';
      case 'Approved':
        return 'check_circle';
      case 'Rejected':
        return 'cancel';
      case 'Expired':
        return 'timer_off';
      case 'Revoked':
        return 'block';
      default:
        return 'info';
    }
  }

  private respond(requestId: string, action: 'approve' | 'reject'): void {
    if (this.respondingRequestId()) {
      return;
    }

    this.respondingRequestId.set(requestId);
    const operation =
      action === 'approve'
        ? this.accessRequestsService.approve(requestId)
        : this.accessRequestsService.reject(requestId);

    operation
      .pipe(finalize(() => this.respondingRequestId.set(null)))
      .subscribe({
        next: (updatedRequest) => {
          this.requests.update((items) =>
            items.map((item) =>
              item.id === updatedRequest.id ? updatedRequest : item,
            ),
          );
          this.snackBar.open(
            action === 'approve'
              ? 'Acceso aceptado'
              : 'Solicitud rechazada',
            'OK',
            { duration: 3000 },
          );
          this.loadRequests();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'No se pudo responder la solicitud',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  private getActionKey(request: PatientClinicalAccessRequestDto): string {
    return `${request.accessSource || 'Request'}-${request.id}-${request.professionalProfileId}`;
  }
}
