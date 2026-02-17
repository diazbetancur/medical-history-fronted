import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ProfessionalsSearchStore } from '@data/stores/professionals-search.store';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/**
 * Search Professionals Page
 *
 * Página de búsqueda de profesionales para pacientes.
 * Permite buscar por nombre, especialidad y ubicación.
 */
@Component({
  selector: 'app-search-professionals-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="search-professionals-page">
      <header class="page-header">
        <h1>Buscar Profesionales</h1>
        <p class="subtitle">Encuentra al profesional ideal para tu consulta</p>
      </header>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Buscar por nombre o especialidad</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [formControl]="queryControl"
                placeholder="Ej: Cardiología, Dr. Pérez"
              />
              @if (queryControl.value) {
                <button
                  matSuffix
                  mat-icon-button
                  (click)="clearQuery()"
                  aria-label="Limpiar búsqueda"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Especialidad</mat-label>
              <mat-icon matPrefix>medical_services</mat-icon>
              <input
                matInput
                [formControl]="specialtyControl"
                placeholder="Ej: Cardiología"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Ubicación</mat-label>
              <mat-icon matPrefix>location_on</mat-icon>
              <input
                matInput
                [formControl]="locationControl"
                placeholder="Ej: Madrid"
              />
            </mat-form-field>

            <button
              mat-raised-button
              color="warn"
              (click)="clearFilters()"
              class="clear-btn"
            >
              <mat-icon>clear_all</mat-icon>
              Limpiar filtros
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      @if (store.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando profesionales...</p>
        </div>
      } @else if (!store.hasProfessionals()) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon class="empty-icon">person_search</mat-icon>
            <h3>No se encontraron profesionales</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Professionals Grid -->
        <div class="professionals-grid">
          @for (professional of store.professionals(); track professional.id) {
            <mat-card
              class="professional-card"
              (click)="viewProfessional(professional.slug)"
            >
              <mat-card-header>
                <div mat-card-avatar class="professional-avatar">
                  <mat-icon>person</mat-icon>
                </div>
                <mat-card-title>{{ professional.name }}</mat-card-title>
                <mat-card-subtitle>
                  @if (professional.specialty) {
                    <mat-icon class="specialty-icon">medical_services</mat-icon>
                    {{ professional.specialty }}
                  }
                </mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                @if (professional.location) {
                  <div class="info-row">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ professional.location }}</span>
                  </div>
                }

                @if (professional.rating) {
                  <div class="info-row rating">
                    <mat-icon class="star-icon">star</mat-icon>
                    <span>{{ professional.rating.toFixed(1) }} / 5.0</span>
                  </div>
                }

                @if (!professional.isActive) {
                  <mat-chip class="inactive-chip" color="warn">
                    No disponible
                  </mat-chip>
                }
              </mat-card-content>

              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>visibility</mat-icon>
                  Ver perfil
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <!-- Pagination -->
        @if (store.total() > (store.filters().pageSize || 12)) {
          <mat-paginator
            [length]="store.total()"
            [pageSize]="store.filters().pageSize || 12"
            [pageIndex]="(store.filters().page || 1) - 1"
            [pageSizeOptions]="[12, 24, 48]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          >
          </mat-paginator>
        }
      }
    </div>
  `,
  styles: [
    `
      .search-professionals-page {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 24px;

        h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 500;
        }

        .subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 16px;
        }
      }

      .filters-card {
        margin-bottom: 24px;

        .filters-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-start;

          .filter-field {
            flex: 1;
            min-width: 200px;
          }

          .clear-btn {
            margin-top: 8px;
          }
        }
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;

        p {
          margin-top: 16px;
          color: var(--color-text-secondary);
        }
      }

      .empty-state {
        text-align: center;
        padding: 64px 24px;

        .empty-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--color-text-disabled);
          margin: 0 auto 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 500;
        }

        p {
          margin: 0;
          color: var(--color-text-secondary);
        }
      }

      .professionals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 24px;
      }

      .professional-card {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px var(--color-border);
        }

        .professional-avatar {
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        mat-card-header {
          mat-card-subtitle {
            display: flex;
            align-items: center;
            gap: 4px;

            .specialty-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }

        mat-card-content {
          .info-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: var(--color-text-primary);

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }

            &.rating {
              .star-icon {
                color: var(--color-warning);
              }
            }
          }

          .inactive-chip {
            margin-top: 8px;
          }
        }

        mat-card-actions {
          padding: 0 16px 16px;

          button {
            width: 100%;

            mat-icon {
              margin-right: 8px;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .search-professionals-page {
          padding: 16px;
        }

        .filters-card .filters-row {
          flex-direction: column;

          .filter-field,
          .clear-btn {
            width: 100%;
          }
        }

        .professionals-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SearchProfessionalsPage implements OnInit {
  protected readonly store = inject(ProfessionalsSearchStore);
  private readonly router = inject(Router);

  // Form controls
  protected readonly queryControl = new FormControl('');
  protected readonly specialtyControl = new FormControl('');
  protected readonly locationControl = new FormControl('');

  ngOnInit(): void {
    // Initial search
    this.store.searchProfessionals();

    // Setup debounced search
    this.queryControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((query) => {
        this.store.setFilters({ query: query || undefined, page: 1 });
      });

    this.specialtyControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((specialty) => {
        this.store.setFilters({ specialty: specialty || undefined, page: 1 });
      });

    this.locationControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((location) => {
        this.store.setFilters({ location: location || undefined, page: 1 });
      });
  }

  protected clearQuery(): void {
    this.queryControl.setValue('');
  }

  protected clearFilters(): void {
    this.queryControl.setValue('');
    this.specialtyControl.setValue('');
    this.locationControl.setValue('');
    this.store.clearFilters();
  }

  protected onPageChange(event: PageEvent): void {
    this.store.setFilters({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    });
  }

  protected viewProfessional(slug: string): void {
    this.router.navigate(['/patient/professionals', slug]);
  }
}
