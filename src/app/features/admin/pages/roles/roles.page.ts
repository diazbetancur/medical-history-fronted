import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import type { Role } from '@data/api/roles.api';
import { RolesStore } from '@data/stores/roles.store';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import { PERMISSIONS } from '../../admin-menu.config';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './roles.page.html',
  styleUrl: './roles.page.scss',
})
export class RolesPageComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly rolesStore = inject(RolesStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // State from store
  readonly roles = this.rolesStore.roles;
  readonly loading = this.rolesStore.loading;
  readonly error = this.rolesStore.error;

  // Table configuration
  displayedColumns = ['name', 'description', 'type', 'actions'];

  // Permission checks
  readonly canCreate = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.ROLES_CREATE),
  );

  readonly canUpdate = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.ROLES_UPDATE),
  );

  readonly canDelete = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.ROLES_DELETE),
  );

  readonly canManagePermissions = computed(() =>
    this.authStore
      .userPermissions()
      .includes(PERMISSIONS.ROLES_MANAGE_PERMISSIONS),
  );

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.rolesStore.loadRoles();
  }

  openCreateDialog() {
    if (!this.canCreate()) {
      this.toast.error('No tienes permisos para crear roles');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('./create-role-dialog.component').then(
      ({ CreateRoleDialogComponent }) => {
        const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
          width: '500px',
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.success) {
            this.toast.success('Rol creado correctamente');
          }
        });
      },
    );
  }

  openEditDialog(role: Role) {
    if (!this.canUpdate()) {
      this.toast.error('No tienes permisos para editar roles');
      return;
    }

    // Permitir editar descripción de roles del sistema
    // El dialog debe deshabilitar el campo 'name' si isSystem === true

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('./edit-role-dialog.component').then(
      ({ EditRoleDialogComponent }) => {
        const dialogRef = this.dialog.open(EditRoleDialogComponent, {
          width: '500px',
          data: { role },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.success) {
            this.toast.success('Rol actualizado correctamente');
          }
        });
      },
    );
  }

  deleteRole(role: Role) {
    if (!this.canDelete()) {
      this.toast.error('No tienes permisos para eliminar roles');
      return;
    }

    if (role.isSystem) {
      this.toast.warning('No se pueden eliminar roles del sistema');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar rol',
        message: `¿Estás seguro de eliminar el rol "${role.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.rolesStore.deleteRole(role.id).subscribe({
        next: () => {
          this.toast.success('Rol eliminado correctamente');
        },
        error: () => {
          this.toast.error('Error al eliminar el rol');
        },
      });
    });
  }

  managePermissions(role: Role) {
    if (!this.canManagePermissions()) {
      this.toast.error('No tienes permisos para gestionar permisos');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(['/admin/roles', role.id, 'permissions']);
  }

  getRoleTypeChip(isSystem: boolean): { label: string; color: string } {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return isSystem
      ? { label: 'Sistema', color: 'accent' }
      : { label: 'Personalizado', color: 'primary' };
  }

  canEditRole(role: Role): boolean {
    // Permitir editar roles del sistema (solo descripción, no nombre)
    return this.canUpdate();
  }

  canDeleteRole(role: Role): boolean {
    // NO permitir eliminar roles del sistema
    return !role.isSystem && this.canDelete();
  }
}
