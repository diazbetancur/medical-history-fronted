import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthStore } from '@core/auth';
import type { SpecialtyDto } from '@data/models';
import { SpecialtiesAdminStore } from '@data/stores';
import { ToastService } from '@shared/services';
import { PERMISSIONS } from '../../admin-menu.config';

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
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
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

  readonly professionalSearch = signal('');
  readonly catalogFilter = signal('');

  readonly userPermissions = this.authStore.userPermissions;
  private readonly viewPermissions = new Set<string>([
    PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
    PERMISSIONS.PROFILES_VIEW,
  ]);
  private readonly managePermissions = new Set<string>([
    PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
    PERMISSIONS.PROFILES_UPDATE,
    PERMISSIONS.PROFILES_VERIFY,
  ]);

  readonly canViewPage = computed(() =>
    this.userPermissions().some((permission) =>
      this.viewPermissions.has(permission),
    ),
  );

  readonly canManageAssignments = computed(() =>
    this.userPermissions().some((permission) =>
      this.managePermissions.has(permission),
    ),
  );

  readonly filteredCatalog = computed(() => {
    const filter = this.catalogFilter().trim().toLowerCase();
    const catalog = this.store.catalog();

    if (!filter) {
      return catalog;
    }

    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(filter) ||
        item.slug.toLowerCase().includes(filter),
    );
  });

  readonly selectedCount = this.store.selectedCount;
  readonly primarySpecialtyId = this.store.primarySpecialtyId;
  readonly displayedColumns = ['selected', 'primary', 'name', 'slug', 'stats'];

  ngOnInit(): void {
    if (!this.canViewPage()) {
      return;
    }

    this.store.loadCatalog();
  }

  searchProfessionals(): void {
    if (!this.professionalSearch().trim()) {
      this.toast.warning('Ingresa nombre o correo del profesional');
      return;
    }

    this.store.searchProfessionals(this.professionalSearch());
  }

  onProfessionalSelected(professionalId: string | null): void {
    if (!professionalId) {
      this.store.clearSelection();
      return;
    }

    const selected = this.store
      .professionalCandidates()
      .find((item) => item.id === professionalId);

    if (selected) {
      this.store.selectProfessional(selected);
    }
  }

  isSelected(specialtyId: string): boolean {
    return this.store.selectedIds().has(specialtyId);
  }

  toggleSpecialty(specialty: SpecialtyDto, checked: boolean): void {
    if (!this.canManageAssignments()) {
      this.toast.error('No tienes permisos para modificar especialidades');
      return;
    }

    this.store.toggleSpecialty(specialty, checked);
  }

  setPrimary(specialtyId: string): void {
    if (!this.canManageAssignments()) {
      this.toast.error('No tienes permisos para modificar especialidades');
      return;
    }

    this.store.setPrimary(specialtyId);
  }

  save(): void {
    if (!this.canManageAssignments()) {
      this.toast.error('No tienes permisos para actualizar especialidades');
      return;
    }

    this.store.saveAssignments().subscribe();
  }

  clearSelection(): void {
    this.store.clearSelection();
    this.professionalSearch.set('');
  }
}
