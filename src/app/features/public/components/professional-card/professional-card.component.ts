import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService, AuthStore } from '@core/auth';
import { PublicHomeProfessionalCardDto } from '../../../../public/models/public-home.dto';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { DoctorNamePipe } from '@shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-professional-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    DoctorNamePipe,
  ],
  templateUrl: './professional-card.component.html',
  styleUrl: './professional-card.component.scss',
})
export class ProfessionalCardComponent {
  @Input({ required: true }) professional!: PublicHomeProfessionalCardDto;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  get imageUrl(): string {
    return (
      this.professional.avatarUrl ||
      'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(this.professional.fullName) +
        '&size=400&background=2563eb&color=ffffff&bold=true'
    );
  }

  onBookAppointment(): void {
    const isAuthenticated =
      this.authStore.isAuthenticated() || this.authService.isAuthenticated();

    if (!isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/pro/${this.professional.slug}`,
        },
      });
      return;
    }

    const hasPatientContext =
      this.authStore.currentContext()?.type === 'PATIENT' ||
      this.authStore.availableContexts().some((ctx) => ctx.type === 'PATIENT');

    if (hasPatientContext || this.authService.isClient()) {
      this.dialog.open(BookAppointmentDialogComponent, {
        width: '760px',
        maxWidth: '96vw',
        data: {
          slug: this.professional.slug,
          name: this.professional.fullName,
          imageUrl: this.imageUrl,
          specialties: this.professional.specialty
            ? [this.professional.specialty]
            : [],
        },
      });
    } else {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/pro/${this.professional.slug}`,
        },
      });
    }
  }
}
