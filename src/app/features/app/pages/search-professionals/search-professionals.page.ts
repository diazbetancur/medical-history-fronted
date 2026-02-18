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
  templateUrl: './search-professionals.page.html',
  styleUrls: ['./search-professionals.page.scss'],
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
