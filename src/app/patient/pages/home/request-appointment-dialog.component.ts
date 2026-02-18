import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { PublicApi } from '@data/api';
import { City } from '@data/api/api-models';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  getInitials,
  ProfessionalSearchFiltersDto,
  ProfessionalSearchResultDto,
} from '../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../public/services/public-professionals.service';
import { AppointmentDto } from '../../models/appointment.dto';
import { AppointmentsService } from '../../services/appointments.service';

export interface SelectedProfessionalForBooking {
  professionalProfileId: string;
  slug: string;
  fullName: string;
  photoUrl?: string;
  specialty?: string;
}

export interface RequestAppointmentDialogData {
  pageSize?: number;
}

@Component({
  selector: 'app-request-appointment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>Solicitar cita</h2>

    <mat-dialog-content class="dialog-content">
      @if (recentProfessionals().length > 0) {
        <mat-card class="recent-card">
          <mat-card-content>
            <h3>Últimos médicos visitados</h3>
            <div class="recent-list">
              @for (
                item of recentProfessionals();
                track item.professionalProfileId
              ) {
                <button
                  mat-stroked-button
                  type="button"
                  (click)="selectProfessional(item)"
                >
                  <span class="name">{{ item.fullName }}</span>
                  @if (item.specialties.length > 0) {
                    <span class="specialty">{{
                      item.specialties[0].name
                    }}</span>
                  }
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
                <mat-option [value]="null">Todas</mat-option>
                @for (specialty of specialties(); track specialty.id) {
                  <mat-option [value]="specialty.id">{{
                    specialty.name
                  }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Ciudad</mat-label>
              <mat-select [formControl]="cityControl">
                <mat-option [value]="null">Todas</mat-option>
                @for (city of cities(); track city.id) {
                  <mat-option [value]="city.id">{{ city.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar médico</mat-label>
              <input
                matInput
                [formControl]="searchControl"
                (focus)="loadDefaultResults()"
                placeholder="Nombre o especialidad"
              />
              @if (searchControl.value) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              (click)="searchProfessionals()"
              [disabled]="loading()"
            >
              <mat-icon>search</mat-icon>
              Buscar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="state-block">
          <mat-spinner diameter="32"></mat-spinner>
          <p>Buscando médicos...</p>
        </div>
      } @else if (errorMessage()) {
        <div class="state-block error">{{ errorMessage() }}</div>
      } @else if (hasSearched() && results().length === 0) {
        <div class="state-block">
          No encontramos médicos con esos filtros. Prueba cambiando ciudad o
          especialidad.
        </div>
      } @else if (results().length > 0) {
        <div class="results-list">
          @for (item of results(); track item.professionalProfileId) {
            <mat-card class="result-card" (click)="selectProfessional(item)">
              <mat-card-content>
                <div class="result-row">
                  <div class="avatar">
                    @if (item.photoUrl) {
                      <img [src]="item.photoUrl" [alt]="item.fullName" />
                    } @else {
                      <span class="initials">{{
                        getInitials(item.fullName)
                      }}</span>
                    }
                  </div>

                  <div class="info">
                    <h4>{{ item.fullName }}</h4>
                    <p>
                      {{
                        item.specialties.at(0)?.name ||
                          'Especialidad no disponible'
                      }}
                    </p>
                    @if (item.city) {
                      <span class="city">{{ item.city }}</span>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 760px;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 2fr auto;
        gap: 12px;
        align-items: start;
      }

      .search-field {
        width: 100%;
      }

      .recent-card h3 {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 600;
      }

      .recent-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .recent-list button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .recent-list .name {
        font-weight: 600;
      }

      .recent-list .specialty {
        color: var(--color-text-secondary);
        font-size: 12px;
      }

      .state-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 8px;
        background: var(--color-background-alt);
        color: var(--color-text-secondary);
      }

      .state-block.error {
        color: var(--color-danger);
      }

      .results-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .result-card {
        cursor: pointer;
        border: 1px solid var(--color-border);
      }

      .result-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--color-background-alt);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .initials {
        font-weight: 600;
      }

      .info h4 {
        margin: 0 0 2px;
        font-size: 16px;
      }

      .info p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 14px;
      }

      .city {
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      @media (max-width: 900px) {
        .dialog-content {
          min-width: auto;
        }

        .filters-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RequestAppointmentDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly publicApi = inject(PublicApi);
  private readonly dialogRef = inject(
    MatDialogRef<
      RequestAppointmentDialogComponent,
      SelectedProfessionalForBooking | null
    >,
  );
  readonly data = inject<RequestAppointmentDialogData>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly searchControl = new FormControl<string>('');
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly cityControl = new FormControl<string | null>(null);

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly cities = signal<City[]>([]);
  readonly recentProfessionals = signal<ProfessionalSearchResultDto[]>([]);
  readonly results = signal<ProfessionalSearchResultDto[]>([]);

  readonly getInitials = getInitials;

  constructor() {
    this.loadCatalogs();
    this.loadRecentProfessionals();
    this.setupDebounce();
    this.loadDefaultResults();
  }

  close(): void {
    this.dialogRef.close(null);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.loadDefaultResults();
  }

  loadDefaultResults(): void {
    if (this.hasSearched()) {
      return;
    }
    this.searchProfessionals();
  }

  searchProfessionals(): void {
    const filters: ProfessionalSearchFiltersDto = {
      q: this.searchControl.value?.trim() || undefined,
      specialtyId: this.specialtyControl.value || undefined,
      cityId: this.cityControl.value || undefined,
      page: 1,
      pageSize: this.data?.pageSize ?? 12,
    };

    this.loading.set(true);
    this.errorMessage.set(null);
    this.hasSearched.set(true);

    this.professionalsService.search(filters).subscribe({
      next: (response) => {
        this.results.set(response.professionals ?? []);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(getUserMessage(error));
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }

  selectProfessional(item: ProfessionalSearchResultDto): void {
    if (item.slug) {
      this.dialogRef.close({
        professionalProfileId: item.professionalProfileId,
        slug: item.slug,
        fullName: item.fullName,
        photoUrl: item.photoUrl,
        specialty: item.specialties[0]?.name,
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.professionalsService
      .search({ q: item.fullName, page: 1, pageSize: 20 })
      .subscribe({
        next: (response) => {
          const resolved = response.professionals.find(
            (prof) => prof.professionalProfileId === item.professionalProfileId,
          );

          if (!resolved?.slug) {
            this.errorMessage.set(
              'No pudimos abrir este médico. Intenta buscarlo por nombre.',
            );
            this.loading.set(false);
            return;
          }

          this.loading.set(false);
          this.dialogRef.close({
            professionalProfileId: resolved.professionalProfileId,
            slug: resolved.slug,
            fullName: resolved.fullName,
            photoUrl: resolved.photoUrl,
            specialty: resolved.specialties[0]?.name,
          });
        },
        error: (error: ApiError) => {
          this.errorMessage.set(getUserMessage(error));
          this.loading.set(false);
        },
      });
  }

  private setupDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.searchProfessionals());

    this.specialtyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.searchProfessionals());

    this.cityControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.searchProfessionals());
  }

  private loadCatalogs(): void {
    this.catalogService.getSpecialties().subscribe({
      next: (items) => this.specialties.set(items),
      error: () => this.specialties.set([]),
    });

    this.publicApi.getMetadata().subscribe({
      next: (metadata) => this.cities.set(metadata.cities ?? []),
      error: () => this.cities.set([]),
    });
  }

  private loadRecentProfessionals(): void {
    this.appointmentsService
      .getMyAppointments({ page: 1, pageSize: 30 })
      .subscribe({
        next: (response) => {
          const map = new Map<string, ProfessionalSearchResultDto>();

          response.appointments.forEach((appointment) => {
            const mapped = this.mapAppointmentToProfessional(appointment);
            if (!map.has(mapped.professionalProfileId)) {
              map.set(mapped.professionalProfileId, mapped);
            }
          });

          this.recentProfessionals.set([...map.values()].slice(0, 8));
        },
        error: () => this.recentProfessionals.set([]),
      });
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
      city: undefined,
      country: undefined,
      isAvailableForAppointments: true,
    };
  }
}
