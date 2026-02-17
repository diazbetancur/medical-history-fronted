import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  Input,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@shared/services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  getInitials,
  ProfessionalSearchFiltersDto,
  ProfessionalSearchResultDto,
} from '../../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../../public/services/public-professionals.service';
import { AppointmentDto } from '../../../models/appointment.dto';
import { AppointmentsService } from '../../../services/appointments.service';
import { SelectedProfessional, WizardStore } from '../patient-wizard.page';

@Component({
  selector: 'app-step2-search-professional',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="step-container">
      <h2>Buscar Profesional</h2>
      <p class="subtitle">
        Busca por nombre o especialidad. Al seleccionar un profesional, pasarás
        al calendario.
      </p>

      @if (recentProfessionals().length > 0) {
        <mat-card class="recent-card">
          <mat-card-content>
            <h3>Médicos con citas anteriores</h3>
            <div class="recent-list">
              @for (
                prof of recentProfessionals();
                track prof.professionalProfileId
              ) {
                <button
                  mat-stroked-button
                  type="button"
                  (click)="selectProfessional(prof, true)"
                >
                  <span class="name">{{ prof.fullName }}</span>
                  <span class="specialty">{{ getPrimarySpecialty(prof) }}</span>
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>Especialidad</mat-label>
              <mat-select [formControl]="specialtyControl">
                <mat-option [value]="null">Todas las especialidades</mat-option>
                @for (specialty of specialties(); track specialty.id) {
                  <mat-option [value]="specialty.id">
                    {{ specialty.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Buscar por nombre o especialidad</mat-label>
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Ej: Dra. García, Pediatría"
              />
              @if (searchControl.value) {
                <button
                  matSuffix
                  mat-icon-button
                  (click)="searchControl.setValue('')"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              class="search-button"
              [disabled]="isLoading()"
              (click)="onSearch()"
            >
              <mat-icon>search</mat-icon>
              Buscar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Buscando profesionales...</p>
        </div>
      }

      @if (!isLoading() && hasSearched()) {
        @if (professionals().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>person_search</mat-icon>
              <h3>No se encontraron profesionales</h3>
              <p>Prueba con otra especialidad, ciudad o nombre.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="results-section">
            <p class="results-count">
              {{ totalResults() }} profesionales encontrados
            </p>

            <div class="professionals-list">
              @for (prof of professionals(); track prof.professionalProfileId) {
                <mat-card
                  class="professional-card"
                  [class.selected]="
                    selectedProfessionalId() === prof.professionalProfileId
                  "
                  (click)="selectProfessional(prof)"
                >
                  <mat-card-content>
                    <div class="professional-header">
                      <div class="avatar">
                        @if (prof.photoUrl) {
                          <img [src]="prof.photoUrl" [alt]="prof.fullName" />
                        } @else {
                          <span class="initials">{{
                            getInitials(prof.fullName)
                          }}</span>
                        }
                      </div>

                      <div class="professional-info">
                        <h3>{{ prof.fullName }}</h3>
                        @if (prof.professionalTitle) {
                          <p class="title">{{ prof.professionalTitle }}</p>
                        }

                        <div class="specialties">
                          @for (
                            specialty of prof.specialties;
                            track specialty.id
                          ) {
                            <mat-chip>{{ specialty.name }}</mat-chip>
                          }
                        </div>
                      </div>

                      @if (
                        selectedProfessionalId() === prof.professionalProfileId
                      ) {
                        <div class="selection-indicator">
                          <mat-icon>check_circle</mat-icon>
                        </div>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <mat-paginator
              [length]="totalResults()"
              [pageSize]="pageSize()"
              [pageIndex]="currentPage() - 1"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            ></mat-paginator>
          </div>
        }
      }

      @if (!hasSearched() && !isLoading()) {
        <mat-card class="initial-state">
          <mat-card-content>
            <mat-icon>assignment_ind</mat-icon>
            <h3>Selecciona tu profesional</h3>
            <p>Filtra por especialidad y ciudad para encontrar más rápido.</p>
          </mat-card-content>
        </mat-card>
      }

      <div class="actions">
        @if (showBack) {
          <button mat-button (click)="back.emit()">Atrás</button>
        }
        <button
          mat-raised-button
          color="primary"
          [disabled]="!selectedProfessionalId()"
          (click)="onNext()"
        >
          Siguiente
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .step-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 500;
      }

      .subtitle {
        margin: 0 0 24px 0;
        color: var(--color-text-secondary);
      }

      .recent-card {
        margin-bottom: 16px;

        h3 {
          margin: 0 0 12px;
          font-size: 16px;
          font-weight: 600;
        }

        .recent-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          button {
            display: inline-flex;
            gap: 6px;
            align-items: center;

            .name {
              font-weight: 600;
            }

            .specialty {
              color: var(--color-text-secondary);
              font-size: 12px;
            }
          }
        }
      }

      .filters-card {
        margin-bottom: 24px;

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          gap: 16px;
          align-items: start;

          mat-form-field {
            width: 100%;
          }

          .search-button {
            height: 56px;
            min-width: 120px;

            mat-icon {
              margin-right: 8px;
            }
          }
        }
      }

      .loading {
        text-align: center;
        padding: 48px;

        p {
          margin-top: 16px;
        }
      }

      .empty-state,
      .initial-state {
        text-align: center;
        padding: 48px;
        margin: 24px 0;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--color-text-disabled);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        p {
          margin: 0;
          color: var(--color-text-secondary);
        }
      }

      .results-section {
        .results-count {
          margin: 0 0 16px 0;
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .professionals-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
      }

      .professional-card {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          box-shadow: var(--shadow-2);
        }

        &.selected {
          border: 2px solid var(--color-primary);
          background: var(--color-surface-hover);
        }

        .professional-header {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          position: relative;
        }

        .avatar {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .initials {
            color: var(--color-text-inverted);
            font-size: 24px;
            font-weight: 500;
          }
        }

        .professional-info {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 500;
          }

          .title {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: var(--color-text-secondary);
          }

          .specialties {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;

            mat-chip {
              font-size: 12px;
              height: 28px;
            }
          }
        }

        .selection-indicator {
          position: absolute;
          top: 0;
          right: 0;

          mat-icon {
            color: var(--color-primary);
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }
      }

      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
      }

      @media (max-width: 1024px) {
        .filters-card .filters-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 768px) {
        .filters-card .filters-grid {
          grid-template-columns: 1fr;

          .search-button {
            width: 100%;
          }
        }

        .professional-card {
          .professional-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .avatar {
            width: 80px;
            height: 80px;

            .initials {
              font-size: 28px;
            }
          }

          .metadata {
            justify-content: center;
          }
        }
      }
    `,
  ],
})
export class Step2SearchProfessionalComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);

  readonly wizardStore = input.required<WizardStore>();
  @Input() showBack = true;
  readonly completed = output<void>();
  readonly back = output<void>();

  readonly specialtyControl = new FormControl<string | null>(null);
  readonly searchControl = new FormControl<string>('');

  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly recentProfessionals = signal<ProfessionalSearchResultDto[]>([]);
  readonly professionals = signal<ProfessionalSearchResultDto[]>([]);
  readonly selectedProfessional = signal<ProfessionalSearchResultDto | null>(
    null,
  );
  readonly selectedProfessionalId = signal<string | null>(null);
  readonly totalResults = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly preselectedSlug = signal<string | null>(null);
  readonly autoSelectedBySlug = signal(false);

  readonly getInitials = getInitials;

  ngOnInit(): void {
    this.loadSpecialties();
    this.loadRecentProfessionals();
    this.setupRoutePrefill();
    this.setupSearchDebounce();
    this.searchProfessionals();
  }

  private loadSpecialties(): void {
    this.catalogService.getSpecialties().subscribe({
      next: (specialties) => {
        this.specialties.set(specialties.filter((s) => s.isActive));
      },
      error: (error: ApiError) => {
        this.toast.error(getUserMessage(error));
      },
    });
  }

  private loadRecentProfessionals(): void {
    this.appointmentsService
      .getMyAppointments({ page: 1, pageSize: 30 })
      .subscribe({
        next: (response) => {
          const uniqueByProfessional = new Map<
            string,
            ProfessionalSearchResultDto
          >();

          response.appointments.forEach((appointment) => {
            const mapped = this.mapAppointmentToProfessional(appointment);
            if (!uniqueByProfessional.has(mapped.professionalProfileId)) {
              uniqueByProfessional.set(mapped.professionalProfileId, mapped);
            }
          });

          this.recentProfessionals.set(
            [...uniqueByProfessional.values()].slice(0, 8),
          );
        },
        error: () => {
          this.recentProfessionals.set([]);
        },
      });
  }

  private setupRoutePrefill(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('professionalSlug');
        this.preselectedSlug.set(slug);
      });
  }

  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.onSearch();
      });

    this.specialtyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onSearch());
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.searchProfessionals();
  }

  private searchProfessionals(): void {
    const filters: ProfessionalSearchFiltersDto = {
      q: this.searchControl.value || undefined,
      specialtyId: this.specialtyControl.value || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize(),
    };

    this.isLoading.set(true);
    this.hasSearched.set(true);

    this.professionalsService.search(filters).subscribe({
      next: (response) => {
        this.professionals.set(response.professionals);
        this.totalResults.set(response.total);
        this.isLoading.set(false);

        const pendingSlug = this.preselectedSlug();
        if (pendingSlug && !this.autoSelectedBySlug()) {
          const matched = response.professionals.find(
            (item) => item.slug === pendingSlug,
          );
          if (matched) {
            this.autoSelectedBySlug.set(true);
            this.selectProfessional(matched, true);
          }
        }
      },
      error: (error: ApiError) => {
        this.isLoading.set(false);
        this.toast.error(getUserMessage(error));
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.searchProfessionals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectProfessional(
    prof: ProfessionalSearchResultDto,
    autoAdvance = true,
  ): void {
    this.selectedProfessional.set(prof);
    this.selectedProfessionalId.set(prof.professionalProfileId);

    if (autoAdvance) {
      this.onNext();
    }
  }

  onNext(): void {
    const selected = this.selectedProfessional();

    if (!selected) return;

    const selectedProfessional: SelectedProfessional = {
      professionalProfileId: selected.professionalProfileId,
      slug: selected.slug,
      name: selected.fullName,
      specialty: selected.specialties[0]?.name,
    };

    this.wizardStore().setProfessional(selectedProfessional);
    this.completed.emit();
  }

  getPrimarySpecialty(prof: ProfessionalSearchResultDto): string {
    return prof.specialties[0]?.name || 'Especialidad no disponible';
  }

  private mapAppointmentToProfessional(
    appointment: AppointmentDto,
  ): ProfessionalSearchResultDto {
    return {
      professionalProfileId: appointment.professionalProfileId,
      slug: '',
      userId: appointment.professional.id,
      fullName: appointment.professional.name,
      professionalTitle: undefined,
      photoUrl: appointment.professional.photoUrl,
      specialties: [
        {
          id: appointment.professional.specialty || 'specialty',
          name: appointment.professional.specialty || 'Especialidad',
        },
      ],
      isAvailableForAppointments: true,
    };
  }
}
