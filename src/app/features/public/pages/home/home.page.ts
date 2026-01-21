import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { HomeStore } from '@data/stores';
import { SeoService } from '@shared/services';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePageComponent implements OnInit {
  readonly store = inject(HomeStore);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.store.load().subscribe({
      next: (response) => {
        if (response.seo) {
          this.seoService.setSeo(response.seo);
        }
      },
      error: () => {
        // Error is handled by store and shown in UI
      },
    });
  }

  reload(): void {
    this.store.load(true).subscribe({
      next: (response) => {
        if (response.seo) {
          this.seoService.setSeo(response.seo);
        }
      },
    });
  }
}
