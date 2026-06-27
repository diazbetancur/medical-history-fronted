import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, AuthStore } from '@core/auth';
import { ToastService } from '@shared/services';
import { PublicHomeProfessionalCardDto } from '../../../../public/models/public-home.dto';
import { BookAppointmentDialogComponent } from '../book-appointment-dialog/book-appointment-dialog.component';
import { AuthDialogService } from '../auth-modal/auth-dialog.service';
import { DoctorNamePipe } from '@shared/pipes/doctor-name.pipe';

@Component({
  selector: 'app-professional-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    DoctorNamePipe,
  ],
  templateUrl: './professional-card.component.html',
  styleUrl: './professional-card.component.scss',
})
export class ProfessionalCardComponent {
  @Input({ required: true }) professional!: PublicHomeProfessionalCardDto;

  /** Máximo de chips de especialidad visibles antes de colapsar en "+n". */
  private readonly maxVisibleSpecialties = 2;

  /** Especialidades a mostrar; cae a la principal si la lista viene vacía. */
  get specialties(): string[] {
    if (this.professional.specialties?.length) {
      return this.professional.specialties;
    }
    return this.professional.specialty ? [this.professional.specialty] : [];
  }

  /** Las primeras que caben como chips. */
  get visibleSpecialties(): string[] {
    return this.specialties.slice(0, this.maxVisibleSpecialties);
  }

  /** Las que no caben (se resumen en el badge "+n"). */
  get hiddenSpecialties(): string[] {
    return this.specialties.slice(this.maxVisibleSpecialties);
  }

  get hiddenCount(): number {
    return this.hiddenSpecialties.length;
  }

  /** Texto del tooltip al pasar sobre "+n": lista las ocultas. */
  get hiddenTooltip(): string {
    return this.hiddenSpecialties.join(', ');
  }

  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly authDialog = inject(AuthDialogService);
  private readonly toast = inject(ToastService);

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
      // Abrimos el modal de auth (no la página /login); si inicia sesión,
      // reintentamos el agendamiento ya autenticado.
      this.authDialog
        .open()
        .afterClosed()
        .subscribe(() => {
          if (
            this.authStore.isAuthenticated() ||
            this.authService.isAuthenticated()
          ) {
            this.onBookAppointment();
          }
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
          specialties: this.specialties,
        },
      });
    } else {
      this.toast.warning(
        'Necesitas una cuenta de paciente para agendar una cita.',
      );
    }
  }
}
