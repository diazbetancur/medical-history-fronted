import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth';
import { PublicHomeProfessionalCardDto } from '../../../public/models/public-home.dto';

@Component({
  selector: 'app-professional-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="professional-card" [class.unavailable]="!professional.isAvailable">
      <div class="card-image" [style.background-image]="'url(' + imageUrl + ')'">
        <div class="card-overlay">
          <div class="card-info">
            <h3 class="professional-name">{{ professional.fullName }}</h3>
            <p class="professional-specialty">{{ professional.specialty }}</p>
            <div class="card-meta">
              <span class="rating">
                <mat-icon>star</mat-icon>
                {{ professional.rating }} ({{ professional.reviewsCount }})
              </span>
              <span class="experience">{{ professional.yearsOfExperience }} años</span>
            </div>
          </div>
        </div>
      </div>
      <mat-card-actions>
        <button 
          mat-flat-button 
          color="primary" 
          class="book-button"
          [disabled]="!professional.isAvailable"
          (click)="onBookAppointment()">
          {{ professional.isAvailable ? 'Agendar Cita' : 'No Disponible' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .professional-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-2);
      }

      &.unavailable {
        opacity: 0.7;
      }
    }

    .card-image {
      position: relative;
      padding-top: 120%;
      background-size: cover;
      background-position: center;
      background-color: var(--color-background-alt);
    }

    .card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%);
      padding: 20px 16px 16px;
    }

    .card-info {
      color: var(--color-text-inverted);
    }

    .professional-name {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.3;
    }

    .professional-specialty {
      margin: 0 0 12px 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-warning);
      }
    }

    .experience {
      opacity: 0.9;
    }

    mat-card-actions {
      padding: 12px;
    }

    .book-button {
      width: 100%;
      font-weight: 600;
    }
  `],
})
export class ProfessionalCardComponent {
  @Input({ required: true }) professional!: PublicHomeProfessionalCardDto;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  get imageUrl(): string {
    return this.professional.avatarUrl || 'https://ui-avatars.com/api/?name=' + 
      encodeURIComponent(this.professional.fullName) + 
      '&size=400&background=2563eb&color=ffffff&bold=true';
  }

  onBookAppointment(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/patient/wizard?professionalSlug=${this.professional.slug}` },
      });
      return;
    }

    if (this.authService.isClient()) {
      this.router.navigate(['/patient/wizard'], {
        queryParams: { professionalSlug: this.professional.slug },
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/patient/wizard?professionalSlug=${this.professional.slug}` },
      });
    }
  }
}
