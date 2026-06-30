import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { AdminProfessionalListItem } from '@data/api/api-models';
import { TenantsApi } from '@data/api/tenants.api';
import { AdminProfessionalsStore } from '@data/stores/admin-professionals.store';
import { TenantsStore } from '@data/stores/tenants.store';
import { AuthStore } from '@core/auth';
import { ToastService } from '@shared/services';

export interface ModerateProfessionalDialogData {
  professional: AdminProfessionalListItem;
  action: 'verify' | 'disable';
}

export interface ModerateProfessionalDialogResult {
  success: boolean;
}

@Component({
  selector: 'app-moderate-professional-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './moderate-professional.dialog.html',
  styleUrl: './moderate-professional.dialog.scss',
})
export class ModerateProfessionalDialogComponent {
  readonly data = inject<ModerateProfessionalDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        ModerateProfessionalDialogComponent,
        ModerateProfessionalDialogResult
      >
    >(MatDialogRef);
  readonly store = inject(AdminProfessionalsStore);
  private readonly authStore = inject(AuthStore);
  readonly tenantsStore = inject(TenantsStore);
  private readonly tenantsApi = inject(TenantsApi);
  private readonly toastService = inject(ToastService);

  readonly isVerify = this.data.action === 'verify';
  adminNotes = '';
  isFeatured = false;
  readonly error = signal<string | null>(null);

  readonly isSuperAdmin = computed(() =>
    this.authStore.userRoles().some((r) => r.toUpperCase() === 'SUPERADMIN'),
  );

  selectedTenantId: string | null = this.data.professional.tenantId ?? null;
  readonly savingTenant = signal(false);

  confirm(): void {
    this.error.set(null);
    const notes = this.adminNotes.trim() || undefined;
    const id = this.data.professional.id;

    const action$ = this.isVerify
      ? this.store.verifyProfessional(id, notes, this.isFeatured)
      : this.store.disableProfessional(id, notes);

    action$.subscribe({
      next: () => {
        // If SuperAdmin changed the tenant, save it after the main action
        if (
          this.isSuperAdmin() &&
          this.selectedTenantId !== (this.data.professional.tenantId ?? null)
        ) {
          this.saveTenantAndClose();
        } else {
          this.dialogRef.close({ success: true });
        }
      },
      error: (err) => {
        const msg =
          err?.error?.detail ??
          (this.isVerify
            ? 'No se pudo verificar el profesional'
            : 'No se pudo desactivar el profesional');
        this.error.set(msg);
      },
    });
  }

  private saveTenantAndClose(): void {
    this.savingTenant.set(true);
    this.tenantsApi
      .assignProfessionalTenant(this.data.professional.id, this.selectedTenantId)
      .subscribe({
        next: () => {
          this.savingTenant.set(false);
          this.toastService.success('Tenant asignado correctamente');
          this.dialogRef.close({ success: true });
        },
        error: () => {
          this.savingTenant.set(false);
          this.toastService.error('No se pudo asignar el tenant');
          this.dialogRef.close({ success: true });
        },
      });
  }

  saveTenantOnly(): void {
    if (!this.isSuperAdmin()) return;
    this.savingTenant.set(true);
    this.error.set(null);
    this.tenantsApi
      .assignProfessionalTenant(this.data.professional.id, this.selectedTenantId)
      .subscribe({
        next: () => {
          this.savingTenant.set(false);
          this.toastService.success('Tenant asignado correctamente');
        },
        error: () => {
          this.savingTenant.set(false);
          this.toastService.error('No se pudo asignar el tenant');
        },
      });
  }
}
