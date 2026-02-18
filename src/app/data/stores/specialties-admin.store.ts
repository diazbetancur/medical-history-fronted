import { computed, inject, Injectable, signal } from '@angular/core';
import { ProblemDetails } from '@core/models';
import { SpecialtiesApi } from '@data/api';
import {
  CreateSpecialtyDto,
  SpecialtyDto,
  UpdateSpecialtyDto,
} from '@data/models';
import { ToastService } from '@shared/services';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpecialtiesAdminStore {
  private readonly api = inject(SpecialtiesApi);
  private readonly toast = inject(ToastService);

  private readonly _specialties = signal<SpecialtyDto[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<ProblemDetails | null>(null);

  readonly specialties = this._specialties.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalSpecialties = computed(
    () => this.asArray(this._specialties()).length,
  );
  readonly activeSpecialties = computed(
    () =>
      this.asArray(this._specialties()).filter((item) => item.isActive).length,
  );

  loadSpecialties(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api
      .getSpecialties()
      .pipe(
        tap((items) => this._specialties.set(this.asArray(items))),
        catchError((error) => {
          this.handleProblem(
            error,
            'No se pudo cargar el listado de especialidades',
          );
          this._specialties.set([]);
          return of([] as SpecialtyDto[]);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  createSpecialty(dto: CreateSpecialtyDto): Observable<boolean> {
    this._saving.set(true);
    this._error.set(null);

    return this.api.createSpecialty(dto).pipe(
      tap((created) => {
        this._specialties.update((items) => [created, ...items]);
        this.toast.success('Especialidad creada correctamente');
      }),
      tap(() => this.sortByName()),
      tap(() => this.loadSpecialties()),
      map(() => true),
      catchError((error) => {
        this.handleProblem(error, 'No se pudo crear la especialidad');
        return of(false);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  updateSpecialty(id: string, dto: UpdateSpecialtyDto): Observable<boolean> {
    this._saving.set(true);
    this._error.set(null);

    return this.api.updateSpecialty(id, dto).pipe(
      tap((updated) => {
        this._specialties.update((items) =>
          items.map((item) => (item.id === id ? updated : item)),
        );
        this.toast.success('Especialidad actualizada correctamente');
      }),
      tap(() => this.sortByName()),
      tap(() => this.loadSpecialties()),
      map(() => true),
      catchError((error) => {
        this.handleProblem(error, 'No se pudo actualizar la especialidad');
        return of(false);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  deleteSpecialty(id: string, name: string): Observable<boolean> {
    this._saving.set(true);
    this._error.set(null);

    return this.api.deleteSpecialty(id).pipe(
      tap(() => {
        this._specialties.update((items) =>
          items.filter((item) => item.id !== id),
        );
        this.toast.success(`Especialidad "${name}" eliminada correctamente`);
      }),
      tap(() => this.loadSpecialties()),
      map(() => true),
      catchError((error) => {
        this.handleProblem(error, 'No se pudo eliminar la especialidad');
        return of(false);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private sortByName(): void {
    this._specialties.update((items) =>
      [...this.asArray(items)].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  private asArray(value: unknown): SpecialtyDto[] {
    return Array.isArray(value) ? (value as SpecialtyDto[]) : [];
  }

  private handleProblem(error: unknown, fallback: string): void {
    const problem = (error as { error?: ProblemDetails })?.error;

    if (problem?.title && problem?.status) {
      this._error.set(problem);
      this.toast.error(problem.detail || problem.title);
      return;
    }

    this._error.set({
      title: fallback,
      status: 500,
      detail: fallback,
      type: 'about:blank',
    });
    this.toast.error(fallback);
  }
}
