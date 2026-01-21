import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionModuleDisplay, RolesStore } from '@data/stores/roles.store';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-role-permissions-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './role-permissions.page.html',
  styleUrl: './role-permissions.page.scss',
})
export class RolePermissionsPageComponent implements OnInit {
  private readonly rolesStore = inject(RolesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly selectedRole = this.rolesStore.selectedRole;
  readonly permissionsByModule = this.rolesStore.permissionsByModule;
  readonly selectedRolePermissionNames =
    this.rolesStore.selectedRolePermissionNames;
  readonly loading = this.rolesStore.loading;
  readonly saving = this.rolesStore.saving;
  readonly error = this.rolesStore.error;

  readonly selectedPermissions = signal<Set<string>>(new Set());
  readonly hasChanges = signal(false);

  private roleId: string | null = null;

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('id');

    if (!this.roleId) {
      this.toast.error('ID de rol inválido');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate(['/admin/roles']);
      return;
    }

    // Load roles if not loaded
    if (this.rolesStore.roles().length === 0) {
      this.rolesStore.loadRoles();
    }

    // Load permissions
    this.rolesStore.loadPermissions();

    // Load role permissions
    this.rolesStore.loadRolePermissions(this.roleId);

    // Wait for data to load, then initialize selected permissions
    setTimeout(() => {
      const currentPermissions = this.selectedRolePermissionNames();
      this.selectedPermissions.set(new Set(currentPermissions));
      this.hasChanges.set(false);
    }, 500);
  }

  togglePermission(permissionName: string) {
    const current = this.selectedPermissions();
    const newSet = new Set(current);

    if (newSet.has(permissionName)) {
      newSet.delete(permissionName);
    } else {
      newSet.add(permissionName);
    }

    this.selectedPermissions.set(newSet);
    this.checkForChanges();
  }

  toggleModule(module: PermissionModuleDisplay) {
    const current = this.selectedPermissions();
    const newSet = new Set(current);

    const allSelected = module.permissions.every((p) => newSet.has(p));

    if (allSelected) {
      // Deselect all
      for (const perm of module.permissions) {
        newSet.delete(perm);
      }
    } else {
      // Select all
      for (const perm of module.permissions) {
        newSet.add(perm);
      }
    }

    this.selectedPermissions.set(newSet);
    this.checkForChanges();
  }

  isPermissionSelected(permissionName: string): boolean {
    return this.selectedPermissions().has(permissionName);
  }

  isModuleSelected(module: PermissionModuleDisplay): boolean {
    return module.permissions.every((p) => this.selectedPermissions().has(p));
  }

  isModuleIndeterminate(module: PermissionModuleDisplay): boolean {
    const selectedCount = module.permissions.filter((p) =>
      this.selectedPermissions().has(p),
    ).length;

    return selectedCount > 0 && selectedCount < module.permissions.length;
  }

  checkForChanges() {
    const current = this.selectedPermissions();
    const original = this.selectedRolePermissionNames();

    // Check if sets are different
    if (current.size !== original.size) {
      this.hasChanges.set(true);
      return;
    }

    for (const name of current) {
      if (!original.has(name)) {
        this.hasChanges.set(true);
        return;
      }
    }

    this.hasChanges.set(false);
  }

  saveChanges() {
    if (!this.roleId || !this.hasChanges()) return;

    const permissions = Array.from(this.selectedPermissions());

    this.rolesStore
      .updateRolePermissions(this.roleId, { permissions })
      .subscribe({
        next: (response) => {
          this.toast.success(
            `Permisos actualizados: ${response.addedCount} agregados, ${response.removedCount} removidos`,
          );
          this.hasChanges.set(false);

          // Navigate back to roles list
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.router.navigate(['/admin/roles']);
        },
        error: () => {
          this.toast.error('Error al actualizar los permisos');
        },
      });
  }

  cancel() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(['/admin/roles']);
  }

  /**
   * Get a friendly label for a permission name
   * Example: "Users.View" -> "View"
   */
  getPermissionLabel(permissionName: string): string {
    const parts = permissionName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : permissionName;
  }

  getSelectedCount(): number {
    return this.selectedPermissions().size;
  }

  getTotalPermissionsCount(): number {
    return this.permissionsByModule().reduce(
      (total, module) => total + module.permissions.length,
      0,
    );
  }
}
