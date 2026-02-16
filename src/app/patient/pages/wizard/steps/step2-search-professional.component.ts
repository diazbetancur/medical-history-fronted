import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
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
import { ApiError, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@shared/services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  formatRating,
  getInitials,
  ProfessionalSearchFiltersDto,
  ProfessionalSearchResultDto,
} from '../../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../../public/services/public-professionals.service';
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
        Encuentra el profesional de salud que mejor se ajuste a tus necesidades
      </p>

      <!-- Filters Section -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-grid">
            <!-- Specialty Filter -->
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

            <!-- Text Search -->
            <mat-form-field appearance="outline">
              <mat-label>Buscar por nombre</mat-label>
              <input
                matInput
                [formControl]="searchControl"
                placeholder="Ej: Dr. García"
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

            <!-- Search Button -->
            <button
              mat-raised-button
              color="primary"
              (click)="onSearch()"
              [disabled]="isLoading()"
              class="search-button"
            >
              <mat-icon>search</mat-icon>
              Buscar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Buscando profesionales...</p>
        </div>
      }

      <!-- Results Section -->
      @if (!isLoading() && hasSearched()) {
        @if (professionals().length === 0) {
          <!-- Empty State -->
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>person_search</mat-icon>
              <h3>No se encontraron profesionales</h3>
              <p>Intenta ajustar los filtros o buscar con otros criterios.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <!-- Results List -->
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
                      <!-- Avatar -->
                      <div class="avatar">
                        @if (prof.photoUrl) {
                          <img [src]="prof.photoUrl" [alt]="prof.fullName" />
                        } @else {
                          <span class="initials">{{
                            getInitials(prof.fullName)
                          }}</span>
                        }
                      </div>

                      <!-- Info -->
                      <div class="professional-info">
                        <h3>{{ prof.fullName }}</h3>
                        @if (prof.professionalTitle) {
                          <p class="title">{{ prof.professionalTitle }}</p>
                        }

                        <!-- Specialties -->
                        <div class="specialties">
                          @for (
                            specialty of prof.specialties;
                            track specialty.id
                          ) {
                            <mat-chip>{{ specialty.name }}</mat-chip>
                          }
                        </div>

                        <!-- Location & Rating -->
                        <div class="metadata">
                          @if (prof.city) {
                            <span class="location">
                              <mat-icon>place</mat-icon>
                              {{ prof.city }}
                              @if (prof.country) {
                                , {{ prof.country }}
                              }
                            </span>
                          }
                          @if (prof.rating) {
                            <span class="rating">
                              <mat-icon>star</mat-icon>
                              {{ formatRating(prof.rating) }}
                              @if (prof.reviewCount) {
                                ({{ prof.reviewCount }})
                              }
                            </span>
                          }
                          @if (prof.yearsOfExperience) {
                            <span class="experience">
                              <mat-icon>workspace_premium</mat-icon>
                              {{ prof.yearsOfExperience }} años
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Selection Indicator -->
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

            <!-- Paginator -->
            <mat-paginator
              [length]="totalResults()"
              [pageSize]="pageSize()"
              [pageIndex]="currentPage() - 1"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            >
            </mat-paginator>
          </div>
        }
      }

      <!-- Initial State (no search yet) -->
      @if (!hasSearched() && !isLoading()) {
        <mat-card class="initial-state">
          <mat-card-content>
            <mat-icon>assignment_ind</mat-icon>
            <h3>Encuentra tu profesional ideal</h3>
            <p>
              Usa los filtros arriba para buscar profesionales por especialidad
              o nombre.
            </p>
          </mat-card-content>
        </mat-card>
      }

      <!-- Actions -->
      <div class="actions">
        <button mat-button (click)="back.emit()">Atrás</button>
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
        color: rgba(0, 0, 0, 0.6);
      }

      /* Filters */
      .filters-card {
        margin-bottom: 24px;

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
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

      /* Loading */
      .loading {
        text-align: center;
        padding: 48px;

        p {
          margin-top: 16px;
        }
      }

      /* Empty & Initial State */
      .empty-state,
      .initial-state {
        text-align: center;
        padding: 48px;
        margin: 24px 0;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: rgba(0, 0, 0, 0.38);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      /* Results Section */
      .results-section {
        .results-count {
          margin: 0 0 16px 0;
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
        }

        .professionals-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
      }

      /* Professional Card */
      .professional-card {
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        &.selected {
          border: 2px solid var(--mat-sys-primary);
          background: rgba(var(--mat-sys-primary-rgb), 0.05);
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
          background: var(--mat-sys-primary);
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
            color: white;
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
            color: rgba(0, 0, 0, 0.6);
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

          .metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);

            > span {
              display: flex;
              align-items: center;
              gap: 4px;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }
            }

            .rating {
              color: #f9a825;
              font-weight: 500;

              mat-icon {
                color: #f9a825;
              }
            }
          }
        }

        .selection-indicator {
          position: absolute;
          top: 0;
          right: 0;

          mat-icon {
            color: var(--mat-sys-primary);
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }
      }

      /* Actions */
      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
      }

      /* Responsive */
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
  private readonly catalogService = inject(PublicCatalogService);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly toast = inject(ToastService);

  // Inputs/Outputs
  readonly wizardStore = input.required<WizardStore>();
  readonly completed = output<void>();
  readonly back = output<void>();

  // Form Controls
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly searchControl = new FormControl<string>('');

  // State
  readonly isLoading = signal(false);
  readonly hasSearched = signal(false);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly professionals = signal<ProfessionalSearchResultDto[]>([]);
  readonly selectedProfessionalId = signal<string | null>(null);
  readonly totalResults = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  // Helpers
  readonly getInitials = getInitials;
  readonly formatRating = formatRating;

  ngOnInit(): void {
    this.loadSpecialties();
    this.setupSearchDebounce();
  }

  /**
   * Load specialties catalog
   */
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

  /**
   * Setup search debounce (400ms)
   */
  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        // Auto-search on text change
        if (this.hasSearched()) {
          this.onSearch();
        }
      });

    this.specialtyControl.valueChanges.subscribe(() => {
      // Auto-search on specialty change
      if (this.hasSearched()) {
        this.onSearch();
      }
    });
  }

  /**
   * Execute search
   */
  onSearch(): void {
    this.currentPage.set(1); // Reset to first page
    this.searchProfessionals();
  }

  /**
   * Search professionals with current filters
   */
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
      },
      error: (error: ApiError) => {
        this.isLoading.set(false);
        this.toast.error(getUserMessage(error));
      },
    });
  }

  /**
   * Page change event
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.searchProfessionals();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Select professional
   */
  selectProfessional(prof: ProfessionalSearchResultDto): void {
    this.selectedProfessionalId.set(prof.professionalProfileId);
  }

  /**
   * Go to next step
   */
  onNext(): void {
    const professionalId = this.selectedProfessionalId();
    if (!professionalId) return;

    const selected = this.professionals().find(
      (p) => p.professionalProfileId === professionalId,
    );

    if (selected) {
      const selectedProfessional: SelectedProfessional = {
        professionalProfileId: selected.professionalProfileId,
        slug: selected.slug,
        name: selected.fullName,
        specialty: selected.specialties[0]?.name,
      };

      this.wizardStore().setProfessional(selectedProfessional);
      this.completed.emit();
    }
  }
}
