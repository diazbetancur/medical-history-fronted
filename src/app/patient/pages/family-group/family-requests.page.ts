import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { FamilyGroupService } from '../../services/family-group.service';
import type { FamilyJoinRequest } from '../../services/family-group.models';
import { FamilyGroupHelpPanelComponent } from './components/family-group-help-panel/family-group-help-panel.component';

@Component({
  selector: 'app-family-requests',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FamilyGroupHelpPanelComponent,
  ],
  templateUrl: './family-requests.page.html',
  styleUrl: './family-requests.page.scss',
})
export class FamilyRequestsPage implements OnInit {
  private readonly familyGroupService = inject(FamilyGroupService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly respondingRequestId = signal<string | null>(null);
  readonly requests = signal<FamilyJoinRequest[]>([]);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.familyGroupService
      .getIncomingRequests()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (requests) => this.requests.set(requests),
        error: (error) => {
          this.error.set(error.message || 'No se pudieron cargar las invitaciones');
        },
      });
  }

  accept(request: FamilyJoinRequest): void {
    if (this.respondingRequestId()) {
      return;
    }

    this.respondingRequestId.set(request.id);
    this.familyGroupService
      .acceptRequest(request.id)
      .pipe(finalize(() => this.respondingRequestId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Invitación aceptada', 'OK', { duration: 3000 });
          this.loadRequests();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'No se pudo aceptar la invitación',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  reject(request: FamilyJoinRequest): void {
    if (this.respondingRequestId()) {
      return;
    }

    this.respondingRequestId.set(request.id);
    this.familyGroupService
      .rejectRequest(request.id)
      .pipe(finalize(() => this.respondingRequestId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Invitación rechazada', 'OK', { duration: 3000 });
          this.loadRequests();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'No se pudo rechazar la invitación',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  isResponding(request: FamilyJoinRequest): boolean {
    return this.respondingRequestId() === request.id;
  }

  trackRequest(_index: number, request: FamilyJoinRequest): string {
    return request.id;
  }
}
