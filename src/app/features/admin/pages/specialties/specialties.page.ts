import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthStore } from '@core/auth';
import type {
  CreateSpecialtyDto,
  SpecialtyDto,
  UpdateSpecialtyDto,
} from '@data/models';
import { SpecialtiesAdminStore } from '@data/stores/specialties-admin.store';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import { PERMISSIONS } from '../../admin-menu.config';
import { SpecialtyFormDialogComponent } from './specialty-form-dialog.component';

@Component({
  selector: 'app-specialties-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './specialties.page.html',
  styleUrl: './specialties.page.scss',
})
export class SpecialtiesPageComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  readonly store = inject(SpecialtiesAdminStore);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly catalogFilter = signal('');

  readonly userPermissions = this.authStore.userPermissions;
  private readonly viewPermissions = new Set<string>([
    PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
    PERMISSIONS.PROFILES_VIEW,
  ]);
  private readonly managePermissions = new Set<string>([
    PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
  ]);

  readonly canViewPage = computed(() =>
    this.userPermissions().some((permission) =>
      this.viewPermissions.has(permission),
    ),
  );

  readonly canManageCatalog = computed(() =>
    this.userPermissions().some((permission) =>
      this.managePermissions.has(permission),
    ),
  );

  readonly filteredCatalog = computed(() => {
    const filter = this.catalogFilter().trim().toLowerCase();
    const catalog = this.store.specialties();

    if (!filter) {
      return catalog;
    }

    return catalog.filter((item) => item.name.toLowerCase().includes(filter));
  });

  readonly displayedColumns = ['name', 'isActive', 'stats', 'actions'];

  ngOnInit(): void {
    if (!this.canViewPage()) {
      return;
    }

    this.store.loadSpecialties();
  }

  openCreateDialog(): void {
    if (!this.canManageCatalog()) {
      this.toast.error('No tienes permisos para crear especialidades');
      return;
    }

    const dialogRef = this.dialog.open(SpecialtyFormDialogComponent, {
      width: '560px',
      data: { mode: 'create' },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: CreateSpecialtyDto | undefined) => {
        if (result) {
          this.store.createSpecialty(result).subscribe();
        }
      });
  }

  openEditDialog(specialty: SpecialtyDto): void {
    if (!this.canManageCatalog()) {
      this.toast.error('No tienes permisos para editar especialidades');
      return;
    }

    const dialogRef = this.dialog.open(SpecialtyFormDialogComponent, {
      width: '560px',
      data: { mode: 'edit', specialty },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: UpdateSpecialtyDto | undefined) => {
        if (result) {
          this.store.updateSpecialty(specialty.id, result).subscribe();
        }
      });
  }

  deleteSpecialty(specialty: SpecialtyDto): void {
    if (!this.canManageCatalog()) {
      this.toast.error('No tienes permisos para eliminar especialidades');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Eliminar especialidad',
        message: `¿Deseas eliminar la especialidad "${specialty.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.store.deleteSpecialty(specialty.id, specialty.name).subscribe();
      }
    });
  }

  reload(): void {
    this.store.loadSpecialties();
  }
}
