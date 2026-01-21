import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SearchParams } from '@data/models';
import { HomeStore, SearchStore } from '@data/stores';
import { AnalyticsService, SeoService } from '@shared/services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './search.page.html',
  styleUrl: './search.page.scss',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  readonly store = inject(SearchStore);
  private readonly homeStore = inject(HomeStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);

  private readonly destroy$ = new Subject<void>();

  searchQuery = '';

  // Use categories from API via HomeStore
  readonly popularCategories = computed(() =>
    this.homeStore.featuredCategories().map((c) => ({
      name: c.name,
      slug: c.slug,
    })),
  );

  ngOnInit(): void {
    // Load home data to get categories (uses cache if available)
    this.homeStore.load();

    // React to query param changes (SSR-safe)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const searchParams: SearchParams = {
          city: params['city'] || undefined,
          category: params['category'] || undefined,
          q: params['q'] || undefined,
          page: params['page'] ? Number(params['page']) : 1,
        };

        // Update search input from query params
        this.searchQuery = searchParams.q || searchParams.category || '';

        this.loadResults(searchParams);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadResults(params: SearchParams): void {
    this.store.load(params).subscribe({
      next: (response) => {
        if (response.seo) {
          this.seoService.setSeo(response.seo);
        }

        // Track search results view (only when data is loaded)
        this.analytics.trackViewSearchResults({
          city: params.city,
          category: params.category,
          query: params.q,
          page: params.page || 1,
          totalResults: response.pagination?.totalItems || 0,
        });
      },
      error: () => {
        // Error is handled by store and shown in UI
      },
    });
  }

  executeSearch(): void {
    if (!this.searchQuery.trim()) return;

    this.router.navigate(['/search'], {
      queryParams: { q: this.searchQuery.trim(), page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  searchByCategory(category: { name: string; slug: string }): void {
    this.searchQuery = category.name;
    this.router.navigate(['/search'], {
      queryParams: { category: category.slug, q: null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(event: PageEvent): void {
    this.router.navigate(['/search'], {
      queryParams: { page: event.pageIndex + 1 },
      queryParamsHandling: 'merge',
    });
  }

  reload(): void {
    const currentParams = this.store.currentParams() || {};
    this.store.load(currentParams, true).subscribe({
      next: (response) => {
        if (response.seo) {
          this.seoService.setSeo(response.seo);
        }
      },
    });
  }
}
