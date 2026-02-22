import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth';
import type { AdminProfessionalListItem } from '@data/api/api-models';
import type { ProfessionalStatusFilter } from '@data/stores/admin-professionals.store';
import { AdminProfessionalsStore } from '@data/stores/admin-professionals.store';
import { ToastService } from '@shared/services';
import { PERMISSIONS } from '../../admin-menu.config';

@Component({
  selector: 'app-professionals-review',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './professionals-review.page.html',
  styleUrl: './professionals-review.page.scss',
})
export class ProfessionalsReviewPageComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  readonly store = inject(AdminProfessionalsStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly searchValue = signal('');
  readonly drawerOpen = signal(false);
  readonly activeTabIndex = signal(0);

  // ── Table config ──────────────────────────────────────────────────────────
  readonly displayedColumns = [
    'businessName',
    'category',
    'location',
    'status',
    'dateCreated',
    'actions',
  ];
  readonly pageSizeOptions = [10, 20, 50];

  readonly statusTabs: { label: string; filter: ProfessionalStatusFilter }[] = [
    { label: 'Pendientes', filter: 'pending' },
    { label: 'Verificados', filter: 'active' },
    { label: 'Desactivados', filter: 'disabled' },
    { label: 'Todos', filter: 'all' },
  ];

  // ── Permission checks ─────────────────────────────────────────────────────
  readonly canVerify = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.PROFILES_VERIFY),
  );
  readonly canUpdate = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.PROFILES_UPDATE),
  );
  readonly canFeature = computed(() =>
    this.authStore.userPermissions().includes(PERMISSIONS.PROFILES_FEATURE),
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // If route data specifies a defaultFilter (e.g. from /admin/solicitudes),
    // force the store to that filter so the correct tab is pre-selected.
    const defaultFilter = this.route.snapshot.data['defaultFilter'] as
      | ProfessionalStatusFilter
      | undefined;

    if (defaultFilter) {
      const tabIndex = this.statusTabs.findIndex(
        (t) => t.filter === defaultFilter,
      );
      if (tabIndex !== -1) {
        this.activeTabIndex.set(tabIndex);
        this.store.setStatusFilter(defaultFilter);
      }
    }

    this.store.load();
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.store.setQuery(value);
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.store.setQuery('');
  }

  // ── Tab / filter ──────────────────────────────────────────────────────────
  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
    this.store.setStatusFilter(this.statusTabs[index].filter);
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.store.pageSize()) {
      this.store.setPageSize(event.pageSize);
    } else {
      this.store.setPage(event.pageIndex + 1);
    }
  }

  // ── Detail drawer ─────────────────────────────────────────────────────────
  viewProfessional(p: AdminProfessionalListItem): void {
    this.store.selectProfessional(p.id);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.store.clearSelectedProfessional();
  }

  // ── Moderation actions ────────────────────────────────────────────────────
  verifyProfessional(p: AdminProfessionalListItem, event?: Event): void {
    event?.stopPropagation();
    if (!this.canVerify()) {
      this.toast.error('No tienes permisos para verificar profesionales');
      return;
    }

    import('./moderate-professional.dialog').then(
      ({ ModerateProfessionalDialogComponent }) => {
        const dialogRef = this.dialog.open(
          ModerateProfessionalDialogComponent,
          {
            width: '480px',
            data: {
              professional: p,
              action: 'verify',
            },
          },
        );

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.success) {
            this.toast.success(`"${p.businessName}" verificado correctamente`);
          }
        });
      },
    );
  }

  disableProfessional(p: AdminProfessionalListItem, event?: Event): void {
    event?.stopPropagation();
    if (!this.canUpdate()) {
      this.toast.error('No tienes permisos para desactivar profesionales');
      return;
    }

    import('./moderate-professional.dialog').then(
      ({ ModerateProfessionalDialogComponent }) => {
        const dialogRef = this.dialog.open(
          ModerateProfessionalDialogComponent,
          {
            width: '480px',
            data: {
              professional: p,
              action: 'disable',
            },
          },
        );

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.success) {
            this.toast.warning(`"${p.businessName}" desactivado`);
          }
        });
      },
    );
  }

  enableProfessional(p: AdminProfessionalListItem, event?: Event): void {
    event?.stopPropagation();
    if (!this.canUpdate()) {
      this.toast.error('No tienes permisos para activar profesionales');
      return;
    }

    this.store.enableProfessional(p.id).subscribe({
      next: () => this.toast.success(`"${p.businessName}" reactivado`),
      error: () => this.toast.error('Error al reactivar el profesional'),
    });
  }

  toggleFeatured(p: AdminProfessionalListItem, event?: Event): void {
    event?.stopPropagation();
    if (!this.canFeature()) {
      this.toast.error('No tienes permisos para destacar profesionales');
      return;
    }

    const nextFeatured = !p.isFeatured;
    this.store.featureProfessional(p.id, nextFeatured).subscribe({
      next: () =>
        this.toast.success(
          nextFeatured
            ? `"${p.businessName}" ahora es destacado`
            : `"${p.businessName}" ya no es destacado`,
        ),
      error: () => this.toast.error('Error al cambiar estado destacado'),
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  getStatusChip(p: AdminProfessionalListItem): {
    label: string;
    icon: string;
    color: string;
  } {
    if (!p.isActive)
      return { label: 'Desactivado', icon: 'block', color: 'warn' };
    if (p.isVerified)
      return { label: 'Verificado', icon: 'verified', color: 'primary' };
    return { label: 'Pendiente', icon: 'schedule', color: 'accent' };
  }

  trackById(_: number, p: AdminProfessionalListItem): string {
    return p.id;
  }

  reload(): void {
    this.store.reload();
  }
}
