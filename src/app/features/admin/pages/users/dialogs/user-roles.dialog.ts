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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>shield</mat-icon>
      Gestionar Roles
    </h2>

    <mat-dialog-content>
      <!-- User Header -->
      <div class="user-header">
        <mat-icon class="avatar">account_circle</mat-icon>
        <div class="user-info">
          <strong>{{ data.user.userName }}</strong>
          <span class="email">{{ data.user.email }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Loading State -->
      @if (loadingRoles()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando roles disponibles...</p>
        </div>
      }

      <!-- Roles List -->
      @if (!loadingRoles() && roleItems().length > 0) {
        <div class="roles-section">
          <p class="hint">
            <mat-icon>info</mat-icon>
            Selecciona los roles que deseas asignar al usuario
          </p>

          <div class="roles-list">
            @for (role of roleItems(); track role.name) {
              <div class="role-item" [class.selected]="role.selected">
                <mat-checkbox
                  [(ngModel)]="role.selected"
                  (ngModelChange)="onRoleToggle()"
                  [disabled]="saving()"
                >
                  <div class="role-content">
                    <span class="role-name">{{ role.name }}</span>
                    @if (role.isSystem) {
                      <span class="role-badge system">Sistema</span>
                    }
                  </div>
                </mat-checkbox>
              </div>
            }
          </div>
        </div>

        <!-- Changes Summary -->
        @if (hasChanges()) {
          <div class="changes-summary">
            <h4>Cambios a aplicar:</h4>
            @if (rolesToAdd().length > 0) {
              <div class="change-item add">
                <mat-icon>add_circle</mat-icon>
                <span>Agregar: {{ rolesToAdd().join(', ') }}</span>
              </div>
            }
            @if (rolesToRemove().length > 0) {
              <div class="change-item remove">
                <mat-icon>remove_circle</mat-icon>
                <span>Quitar: {{ rolesToRemove().join(', ') }}</span>
              </div>
            }
          </div>
        }
      }

      <!-- Empty State -->
      @if (!loadingRoles() && roleItems().length === 0) {
        <div class="empty-state">
          <mat-icon>info</mat-icon>
          <p>No hay roles disponibles en el sistema</p>
        </div>
      }

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="saving()">
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSave()"
        [disabled]="saving() || loadingRoles() || !hasChanges()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
          Guardar Cambios
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        max-width: 500px;
      }

      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: var(--mat-app-primary);
        }
      }

      .user-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: var(--mat-app-surface-container);
        border-radius: 12px;

        .avatar {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: var(--mat-app-primary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;

          strong {
            font-size: 15px;
          }

          .email {
            font-size: 13px;
            color: var(--mat-app-on-surface-variant);
          }
        }
      }

      .divider {
        height: 1px;
        background: var(--mat-app-outline-variant);
        margin: 16px 0;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px;
        gap: 16px;

        p {
          margin: 0;
          color: var(--mat-app-on-surface-variant);
          font-size: 14px;
        }
      }

      .roles-section {
        .hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          padding: 8px 12px;
          background: var(--mat-app-surface-container);
          border-radius: 8px;
          font-size: 13px;
          color: var(--mat-app-on-surface-variant);

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .roles-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .role-item {
        padding: 8px 12px;
        border-radius: 8px;
        transition: background 0.2s ease;

        &:hover {
          background: var(--mat-app-surface-container-low);
        }

        &.selected {
          background: var(--mat-app-primary-container);
        }

        .role-content {
          display: flex;
          align-items: center;
          gap: 8px;

          .role-name {
            font-weight: 500;
          }

          .role-badge {
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;

            &.system {
              background: var(--mat-app-secondary-container);
              color: var(--mat-app-on-secondary-container);
            }
          }
        }
      }

      .changes-summary {
        margin-top: 16px;
        padding: 12px 16px;
        background: var(--mat-app-surface-container);
        border-radius: 8px;

        h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--mat-app-on-surface-variant);
        }

        .change-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          padding: 4px 0;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }

          &.add {
            color: var(--mat-app-primary);
          }

          &.remove {
            color: var(--mat-app-error);
          }
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px;
        gap: 12px;
        text-align: center;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--mat-app-on-surface-variant);
          opacity: 0.5;
        }

        p {
          margin: 0;
          color: var(--mat-app-on-surface-variant);
          font-size: 14px;
        }
      }

      .error-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--mat-app-error-container);
        color: var(--mat-app-on-error-container);
        border-radius: 8px;
        margin-top: 16px;

        mat-icon {
          color: var(--mat-app-error);
          flex-shrink: 0;
        }

        span {
          font-size: 14px;
          line-height: 1.4;
        }
      }

      mat-dialog-actions button {
        mat-spinner {
          display: inline-block;
          margin-right: 8px;
        }
      }
    `,
  ],
})
export class UserRolesDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserRolesDialogComponent>);
  readonly data = inject<UserRolesDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(AdminUsersStore);

  // State
  readonly saving = this.store.saving;
  readonly loadingRoles = this.store.loadingRoles;
  readonly errorMessage = signal<string | null>(null);

  // Role items with selection state
  readonly roleItems = signal<RoleItem[]>([]);

  // Original roles for change detection
  private originalRoles: string[] = [];

  // System roles fallback
  private readonly SYSTEM_ROLES = [
    'SuperAdmin',
    'Admin',
    'Professional',
    'User',
  ];

  // Computed changes
  readonly rolesToAdd = computed(() => {
    const current = this.getSelectedRoles();
    return current.filter((r) => !this.originalRoles.includes(r));
  });

  readonly rolesToRemove = computed(() => {
    const current = this.getSelectedRoles();
    return this.originalRoles.filter((r) => !current.includes(r));
  });

  ngOnInit(): void {
    this.originalRoles = [...this.data.user.roles];
    this.loadRoles();
  }

  private loadRoles(): void {
    // Try to use store's role catalog
    const catalogRoles = this.store.roleNames();

    if (catalogRoles.length > 0) {
      this.initializeRoleItems(catalogRoles);
    } else {
      // Load roles from API
      this.store.loadRolesCatalog();

      // Watch for roles to load
      const checkLoaded = setInterval(() => {
        if (!this.loadingRoles()) {
          clearInterval(checkLoaded);
          const loadedRoles = this.store.roleNames();
          if (loadedRoles.length > 0) {
            this.initializeRoleItems(loadedRoles);
          } else {
            // Fallback to system roles + user's current roles
            this.initializeRoleItems(this.getFallbackRoles());
          }
        }
      }, 100);

      // Timeout safety
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

    // Sort: system roles first, then alphabetically
    items.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return a.name.localeCompare(b.name);
    });

    this.roleItems.set(items);
  }

  onRoleToggle(): void {
    // Force signal update
    this.roleItems.update((items) => [...items]);
  }

  hasChanges(): boolean {
    return this.rolesToAdd().length > 0 || this.rolesToRemove().length > 0;
  }

  private getSelectedRoles(): string[] {
    return this.roleItems()
      .filter((r) => r.selected)
      .map((r) => r.name);
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

    // Watch for completion
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

    // Timeout safety
    setTimeout(() => clearInterval(checkComplete), 30000);
  }
}
