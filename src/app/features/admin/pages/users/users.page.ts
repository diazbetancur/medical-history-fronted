import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/auth';
import type { AdminUserListDto } from '@data/api/admin-users.types';
import { AdminUsersStore } from '@data/stores/admin-users.store';
import { ToastService } from '@shared/services';
import { PERMISSIONS } from '../../admin-menu.config';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly store = inject(AdminUsersStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ==========================================================================
  // Local UI State
  // ==========================================================================

  readonly searchValue = signal('');
  readonly drawerOpen = signal(false);

  // ==========================================================================
  // Store State (read-only signals)
  // ==========================================================================

  readonly users = this.store.users;
  readonly loading = this.store.loading;
  readonly loadingDetail = this.store.loadingDetail;
  readonly saving = this.store.saving;
  readonly error = this.store.error;
  readonly errorMessage = this.store.errorMessage;
  readonly pagination = this.store.pagination;
  readonly selectedUser = this.store.selectedUser;
  readonly totalUsers = this.store.totalUsers;
  readonly page = this.store.page;
  readonly pageSize = this.store.pageSize;

  // ==========================================================================
  // Table Configuration
  // ==========================================================================

  readonly displayedColumns = [
    'userName',
    'email',
    'roles',
    'isLockedOut',
    'createdAt',
    'actions',
  ];

  readonly pageSizeOptions = [5, 10, 25, 50];

  // ==========================================================================
  // Permission Checks
  // ==========================================================================

  readonly canCreate = computed(() =>
    this.authService.hasPermission(PERMISSIONS.USERS_CREATE),
  );

  readonly canUpdate = computed(() =>
    this.authService.hasPermission(PERMISSIONS.USERS_UPDATE),
  );

  readonly canDelete = computed(() =>
    this.authService.hasPermission(PERMISSIONS.USERS_DELETE),
  );

  readonly canAssignRoles = computed(() =>
    this.authService.hasPermission(PERMISSIONS.USERS_ASSIGN_ROLES),
  );

  readonly canView = computed(() =>
    this.authService.hasPermission(PERMISSIONS.USERS_VIEW),
  );

  // ==========================================================================
  // Computed UI State
  // ==========================================================================

  readonly isEmpty = computed(
    () => !this.loading() && this.users().length === 0 && !this.error(),
  );

  readonly showTable = computed(
    () => !this.loading() && this.users().length > 0,
  );

  readonly activeUsersCount = computed(
    () => this.users().filter((u) => !u.isLockedOut).length,
  );

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  ngOnInit(): void {
    this.loadUsers();
    this.store.loadRolesCatalog();
  }

  // ==========================================================================
  // Actions - Data Loading
  // ==========================================================================

  loadUsers(): void {
    this.store.loadUsers();
  }

  retry(): void {
    this.store.clearError();
    this.loadUsers();
  }

  // ==========================================================================
  // Actions - Search
  // ==========================================================================

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.store.setQuery(value);
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.store.setQuery('');
  }

  // ==========================================================================
  // Actions - Pagination
  // ==========================================================================

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.store.setPageSize(event.pageSize);
    } else if (event.pageIndex + 1 !== this.page()) {
      this.store.setPage(event.pageIndex + 1);
    }
  }

  // ==========================================================================
  // Actions - User Operations
  // ==========================================================================

  viewUser(user: AdminUserListDto): void {
    this.store.selectUser(user.id);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.store.clearSelectedUser();
  }

  editUser(user: AdminUserListDto): void {
    if (!this.canUpdate()) {
      this.toast.error('No tienes permisos para editar usuarios');
      return;
    }

    import('./dialogs').then(({ UserEditDialogComponent }) => {
      const dialogRef = this.dialog.open(UserEditDialogComponent, {
        width: '500px',
        data: { user },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.toast.success('Usuario actualizado correctamente');
        }
      });
    });
  }

  manageRoles(user: AdminUserListDto): void {
    if (!this.canAssignRoles()) {
      this.toast.error('No tienes permisos para asignar roles');
      return;
    }

    import('./dialogs').then(({ UserRolesDialogComponent }) => {
      const dialogRef = this.dialog.open(UserRolesDialogComponent, {
        width: '500px',
        data: { user },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.toast.success('Roles actualizados correctamente');
        }
      });
    });
  }

  deleteUser(user: AdminUserListDto): void {
    if (!this.canDelete()) {
      this.toast.error('No tienes permisos para eliminar usuarios');
      return;
    }

    import('./dialogs').then(({ ConfirmDeleteDialogComponent }) => {
      const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
        width: '450px',
        data: { user },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.toast.success('Usuario eliminado correctamente');
          // Close drawer if this user was selected
          if (this.selectedUser()?.id === user.id) {
            this.closeDrawer();
          }
        }
      });
    });
  }

  createUser(): void {
    if (!this.canCreate()) {
      this.toast.error('No tienes permisos para crear usuarios');
      return;
    }

    import('./dialogs').then(({ UserCreateDialogComponent }) => {
      const dialogRef = this.dialog.open(UserCreateDialogComponent, {
        width: '550px',
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result?.success) {
          this.toast.success('Usuario creado correctamente');
        }
      });
    });
  }

  // ==========================================================================
  // UI Helpers
  // ==========================================================================

  getStatusColor(isLockedOut: boolean): 'primary' | 'warn' {
    return isLockedOut ? 'warn' : 'primary';
  }

  getStatusLabel(isLockedOut: boolean): string {
    return isLockedOut ? 'Bloqueado' : 'Activo';
  }

  getStatusIcon(isLockedOut: boolean): string {
    return isLockedOut ? 'lock' : 'check_circle';
  }

  getRoleColor(role: string): 'primary' | 'accent' | 'warn' | undefined {
    const roleColors: Record<
      string,
      'primary' | 'accent' | 'warn' | undefined
    > = {
      SuperAdmin: 'warn',
      Admin: 'accent',
      Professional: 'primary',
      User: undefined,
    };
    return roleColors[role];
  }

  trackByUserId(_index: number, user: AdminUserListDto): string {
    return user.id;
  }
}
