import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type {
  AdminUserListDto,
  UpdateUserRolesDto,
} from '@data/api/admin-users.types';
import { AdminUsersStore } from '@data/stores/admin-users.store';

export interface UserRolesDialogData {
  user: AdminUserListDto;
}

interface RoleItem {
  name: string;
  selected: boolean;
  isSystem: boolean;
}

@Component({
  selector: 'app-user-roles-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-roles.dialog.html',
  styleUrl: './user-roles.dialog.scss',
})
export class UserRolesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserRolesDialogComponent>);
  readonly data = inject<UserRolesDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(AdminUsersStore);

  readonly saving = this.store.saving;
  readonly loadingRoles = this.store.loadingRoles;
  readonly errorMessage = signal<string | null>(null);
  readonly roleItems = signal<RoleItem[]>([]);

  private originalRoles: string[] = [];

  private readonly SYSTEM_ROLES = [
    'SuperAdmin',
    'Admin',
    'Professional',
    'User',
  ];

  readonly rolesToAdd = computed(() => {
    const current = this.getSelectedRoles();
    return current.filter((role) => !this.originalRoles.includes(role));
  });

  readonly rolesToRemove = computed(() => {
    const current = this.getSelectedRoles();
    return this.originalRoles.filter((role) => !current.includes(role));
  });

  ngOnInit(): void {
    this.originalRoles = [...this.data.user.roles];
    this.loadRoles();
  }

  private loadRoles(): void {
    const catalogRoles = this.store.roleNames();

    if (catalogRoles.length > 0) {
      this.initializeRoleItems(catalogRoles);
    } else {
      this.store.loadRolesCatalog();

      const checkLoaded = setInterval(() => {
        if (!this.loadingRoles()) {
          clearInterval(checkLoaded);
          const loadedRoles = this.store.roleNames();
          if (loadedRoles.length > 0) {
            this.initializeRoleItems(loadedRoles);
          } else {
            this.initializeRoleItems(this.getFallbackRoles());
          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkLoaded);
        if (this.roleItems().length === 0) {
          this.initializeRoleItems(this.getFallbackRoles());
        }
      }, 5000);
    }
  }

  private getFallbackRoles(): string[] {
    const allRoles = new Set([...this.SYSTEM_ROLES, ...this.data.user.roles]);
    return Array.from(allRoles);
  }

  private initializeRoleItems(roles: string[]): void {
    const items: RoleItem[] = roles.map((name) => ({
      name,
      selected: this.originalRoles.includes(name),
      isSystem: this.SYSTEM_ROLES.includes(name),
    }));

    items.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return a.name.localeCompare(b.name);
    });

    this.roleItems.set(items);
  }

  onRoleToggle(): void {
    this.roleItems.update((items) => [...items]);
  }

  hasChanges(): boolean {
    return this.rolesToAdd().length > 0 || this.rolesToRemove().length > 0;
  }

  private getSelectedRoles(): string[] {
    return this.roleItems()
      .filter((role) => role.selected)
      .map((role) => role.name);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.hasChanges()) {
      return;
    }

    this.errorMessage.set(null);

    const dto: UpdateUserRolesDto = {
      rolesToAdd: this.rolesToAdd(),
      rolesToRemove: this.rolesToRemove(),
    };

    this.store.updateUserRoles(this.data.user.id, dto);

    const checkComplete = setInterval(() => {
      if (!this.saving()) {
        clearInterval(checkComplete);
        const error = this.store.error();
        if (error) {
          this.errorMessage.set(
            error.message || 'Error al actualizar los roles',
          );
        } else {
          this.dialogRef.close({ success: true });
        }
      }
    }, 100);

    setTimeout(() => clearInterval(checkComplete), 30000);
  }
}
