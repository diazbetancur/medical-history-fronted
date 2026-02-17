import { computed, inject, Injectable, signal } from '@angular/core';
import { ProblemDetails } from '@core/models';
import { SpecialtiesApi } from '@data/api/specialties.api';
import type {
  ProfessionalCandidate,
  SelectedSpecialty,
  SpecialtyDto,
  UpdateProfessionalSpecialtiesItemDto,
} from '@data/models/specialty.models';
import { ToastService } from '@shared/services';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpecialtiesAdminStore {
  private readonly api = inject(SpecialtiesApi);
  private readonly toast = inject(ToastService);

  private readonly _catalog = signal<SpecialtyDto[]>([]);
  private readonly _professionalCandidates = signal<ProfessionalCandidate[]>([]);
  private readonly _selectedProfessional = signal<ProfessionalCandidate | null>(
    null,
  );
  private readonly _selectedSpecialties = signal<SelectedSpecialty[]>([]);

  private readonly _catalogLoading = signal(false);
  private readonly _professionalsLoading = signal(false);
  private readonly _assignmentsLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);

  readonly catalog = this._catalog.asReadonly();
  readonly professionalCandidates = this._professionalCandidates.asReadonly();
  readonly selectedProfessional = this._selectedProfessional.asReadonly();
  readonly selectedSpecialties = this._selectedSpecialties.asReadonly();

  readonly catalogLoading = this._catalogLoading.asReadonly();
  readonly professionalsLoading = this._professionalsLoading.asReadonly();
  readonly assignmentsLoading = this._assignmentsLoading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly selectedCount = computed(() => this._selectedSpecialties().length);
  readonly primarySpecialtyId = computed(
    () => this._selectedSpecialties().find((x) => x.isPrimary)?.specialtyId ?? null,
  );

  readonly canSave = computed(() => {
    const count = this._selectedSpecialties().length;
    const hasPrimary = !!this.primarySpecialtyId();
    return (
      !!this._selectedProfessional() && count >= 1 && count <= 10 && hasPrimary
    );
  });

  readonly selectedIds = computed(
    () => new Set(this._selectedSpecialties().map((item) => item.specialtyId)),
  );

  loadCatalog(): void {
    this._catalogLoading.set(true);
    this._lastError.set(null);

    this.api
      .getCatalog()
      .pipe(
        tap((catalog) => {
          this._catalog.set(catalog.filter((item) => item.isActive));
        }),
        catchError((error) => {
          this.handleProblem(error, 'No se pudo cargar el catálogo de especialidades');
          this._catalog.set([]);
          return of([]);
        }),
        finalize(() => this._catalogLoading.set(false)),
      )
      .subscribe();
  }

  searchProfessionals(query: string): void {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this._professionalCandidates.set([]);
      return;
    }

    this._professionalsLoading.set(true);
    this._lastError.set(null);

    this.api
      .searchProfessionals({
        q: trimmed,
        status: 'all',
        page: 1,
        pageSize: 20,
      })
      .pipe(
        map((response) => response.data ?? []),
        map((items) =>
          items.map((item) => ({
            id: item.id,
            businessName: item.businessName,
            cityName: item.cityName,
            categoryName: item.categoryName,
            email: item.email,
          })),
        ),
        tap((items) => this._professionalCandidates.set(items)),
        catchError((error) => {
          this.handleProblem(error, 'No se pudo buscar profesionales');
          this._professionalCandidates.set([]);
          return of([] as ProfessionalCandidate[]);
        }),
        finalize(() => this._professionalsLoading.set(false)),
      )
      .subscribe();
  }

  selectProfessional(candidate: ProfessionalCandidate): void {
    this._selectedProfessional.set(candidate);
    this.loadProfessionalAssignments(candidate.id);
  }

  loadProfessionalAssignments(professionalProfileId: string): void {
    this._assignmentsLoading.set(true);
    this._lastError.set(null);

    this.api
      .getProfessionalSpecialties(professionalProfileId)
      .pipe(
        tap((response) => {
          this._selectedSpecialties.set(
            response.specialties.map((item) => ({
              specialtyId: item.specialtyId,
              specialtyName: item.specialtyName,
              specialtySlug: item.specialtySlug,
              isPrimary: item.isPrimary,
            })),
          );
        }),
        catchError((error) => {
          this.handleProblem(
            error,
            'No se pudieron cargar las especialidades del profesional',
          );
          this._selectedSpecialties.set([]);
          return of(null);
        }),
        finalize(() => this._assignmentsLoading.set(false)),
      )
      .subscribe();
  }

  toggleSpecialty(specialty: SpecialtyDto, checked: boolean): void {
    const current = this._selectedSpecialties();
    const exists = current.some((item) => item.specialtyId === specialty.id);

    if (checked && !exists) {
      if (current.length >= 10) {
        this.toast.warning('Solo se permiten hasta 10 especialidades');
        return;
      }

      const shouldBePrimary = current.length === 0;
      this._selectedSpecialties.set([
        ...current,
        {
          specialtyId: specialty.id,
          specialtyName: specialty.name,
          specialtySlug: specialty.slug,
          isPrimary: shouldBePrimary,
        },
      ]);
      return;
    }

    if (!checked && exists) {
      const updated = current.filter((item) => item.specialtyId !== specialty.id);
      if (updated.length > 0 && !updated.some((item) => item.isPrimary)) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      this._selectedSpecialties.set(updated);
    }
  }

  setPrimary(specialtyId: string): void {
    this._selectedSpecialties.update((items) =>
      items.map((item) => ({
        ...item,
        isPrimary: item.specialtyId === specialtyId,
      })),
    );
  }

  saveAssignments(): Observable<boolean> {
    const professional = this._selectedProfessional();
    const selected = this._selectedSpecialties();

    if (!professional) {
      this.toast.error('Debes seleccionar un profesional');
      return of(false);
    }

    if (selected.length < 1) {
      this.toast.error('Debes seleccionar al menos 1 especialidad');
      return of(false);
    }

    if (selected.length > 10) {
      this.toast.error('Solo se permiten hasta 10 especialidades');
      return of(false);
    }

    const primaryCount = selected.filter((item) => item.isPrimary).length;
    if (primaryCount !== 1) {
      this.toast.error('Debe existir exactamente una especialidad principal');
      return of(false);
    }

    const payload: UpdateProfessionalSpecialtiesItemDto[] = selected.map((item) => ({
      specialtyId: item.specialtyId,
      isPrimary: item.isPrimary,
    }));

    this._saving.set(true);
    this._lastError.set(null);

    return this.api.updateProfessionalSpecialties(professional.id, payload).pipe(
      tap((response) => {
        this._selectedSpecialties.set(
          response.specialties.map((item) => ({
            specialtyId: item.specialtyId,
            specialtyName: item.specialtyName,
            specialtySlug: item.specialtySlug,
            isPrimary: item.isPrimary,
          })),
        );
        this.toast.success('Especialidades actualizadas correctamente');
      }),
      map(() => true),
      catchError((error) => {
        this.handleProblem(error, 'No se pudieron actualizar las especialidades');
        return of(false);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  clearSelection(): void {
    this._selectedProfessional.set(null);
    this._selectedSpecialties.set([]);
    this._professionalCandidates.set([]);
  }

  private handleProblem(error: unknown, fallbackTitle: string): void {
    const problem = (error as { error?: ProblemDetails })?.error;

    if (problem?.title && problem?.status) {
      this._lastError.set(problem);
      this.toast.error(problem.detail || problem.title);
      return;
    }

    this._lastError.set({
      title: fallbackTitle,
      status: 500,
      detail: fallbackTitle,
      type: 'about:blank',
    });
    this.toast.error(fallbackTitle);
  }
}
