import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { ExternalPatientProfileListDto } from '@data/api/api-models';
import { AdminApi } from '@data/api/admin.api';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';

@Component({
  selector: 'app-external-patient-profiles',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './external-patient-profiles.component.html',
  styleUrl: './external-patient-profiles.component.scss',
})
export class ExternalPatientProfilesComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly searchChanges = new Subject<string>();

  readonly isLoading = signal(false);
  readonly profiles = signal<ExternalPatientProfileListDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly searchValue = signal('');
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  readonly displayedColumns = [
    'patient',
    'document',
    'contact',
    'claimStatus',
    'createdBy',
    'dateCreated',
    'actions',
  ];

  ngOnInit(): void {
    this.searchChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(0);
        this.load();
      });

    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminApi
      .getExternalPatientProfiles({
        page: this.currentPage() + 1,
        pageSize: this.pageSize(),
        q: this.searchValue() || undefined,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.profiles.set(response.data);
          this.totalItems.set(response.pagination.totalItems);
        },
        error: () => {
          this.error.set('Error al cargar los pacientes externos');
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.searchChanges.next(value.trim());
  }

  clearSearch(): void {
    if (!this.searchValue()) return;
    this.searchValue.set('');
    this.searchChanges.next('');
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  getClaimStatusColor(status: number): string {
    switch (status) {
      case 0: return 'default';   // Unclaimed
      case 1: return 'accent';    // ClaimPending
      case 3: return 'warn';      // Rejected
      default: return 'default';
    }
  }

  deleteProfile(profile: ExternalPatientProfileListDto): void {
    const ref = this.dialog.open<ConfirmDialogComponent, unknown, boolean>(
      ConfirmDialogComponent,
      {
        width: '420px',
        data: {
          title: 'Eliminar paciente externo',
          message: `¿Estás seguro de que deseas eliminar permanentemente el perfil de "${profile.fullName}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          confirmColor: 'warn',
          icon: 'delete_forever',
        },
      },
    );

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.deletingId.set(profile.id);
      this.adminApi
        .deleteExternalPatientProfile(profile.id)
        .pipe(finalize(() => this.deletingId.set(null)))
        .subscribe({
          next: () => {
            this.profiles.update((list) => list.filter((p) => p.id !== profile.id));
            this.totalItems.update((n) => n - 1);
            this.toast.success(`Perfil de "${profile.fullName}" eliminado.`);
          },
          error: (err) => {
            const msg = err?.error?.detail || err?.message;
            this.toast.error(msg || 'No se pudo eliminar el perfil.');
          },
        });
    });
  }

  trackByProfileId(_: number, profile: ExternalPatientProfileListDto): string {
    return profile.id;
  }
}
