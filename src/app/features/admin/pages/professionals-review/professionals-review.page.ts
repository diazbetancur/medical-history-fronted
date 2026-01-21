import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/auth';
import { ToastService } from '@shared/services';
import { PERMISSIONS } from '../../admin-menu.config';

interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

@Component({
  selector: 'app-professionals-review',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './professionals-review.page.html',
  styleUrl: './professionals-review.page.scss',
})
export class ProfessionalsReviewPageComponent {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  displayedColumns = ['name', 'specialty', 'status', 'createdAt', 'actions'];

  // Permission checks using computed signals
  readonly canVerify = computed(() =>
    this.authService.hasPermission(PERMISSIONS.PROFILES_VERIFY),
  );
  readonly canUpdate = computed(() =>
    this.authService.hasPermission(PERMISSIONS.PROFILES_UPDATE),
  );
  readonly canFeature = computed(() =>
    this.authService.hasPermission(PERMISSIONS.PROFILES_FEATURE),
  );
  readonly canDelete = computed(() =>
    this.authService.hasPermission(PERMISSIONS.PROFILES_DELETE),
  );

  professionals = signal<Professional[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      specialty: 'Plomero',
      status: 'pending',
      createdAt: '2026-01-14',
    },
    {
      id: '2',
      name: 'María García',
      email: 'maria@example.com',
      specialty: 'Electricista',
      status: 'pending',
      createdAt: '2026-01-13',
    },
    {
      id: '3',
      name: 'Carlos López',
      email: 'carlos@example.com',
      specialty: 'Abogado',
      status: 'verified',
      createdAt: '2026-01-10',
    },
    {
      id: '4',
      name: 'Ana Rodríguez',
      email: 'ana@example.com',
      specialty: 'Contador',
      status: 'verified',
      createdAt: '2026-01-08',
    },
    {
      id: '5',
      name: 'Pedro Martínez',
      email: 'pedro@example.com',
      specialty: 'Veterinario',
      status: 'rejected',
      createdAt: '2026-01-05',
    },
  ]);

  verifyPro(id: string): void {
    if (!this.canVerify()) {
      this.toast.error('No tienes permiso para verificar');
      return;
    }
    this.updateStatus(id, 'verified');
    this.toast.success('Profesional verificado exitosamente');
  }

  rejectPro(id: string): void {
    if (!this.canUpdate()) {
      this.toast.error('No tienes permiso para rechazar');
      return;
    }
    this.updateStatus(id, 'rejected');
    this.toast.warning('Profesional rechazado');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      verified: 'Verificado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  }

  editPro(id: string): void {
    if (!this.canUpdate()) {
      this.toast.error('No tienes permiso para editar');
      return;
    }
    this.toast.info('Editando profesional: ' + id);
  }

  featurePro(id: string): void {
    if (!this.canFeature()) {
      this.toast.error('No tienes permiso para destacar');
      return;
    }
    this.toast.success('Profesional destacado: ' + id);
  }

  deletePro(id: string): void {
    if (!this.canDelete()) {
      this.toast.error('No tienes permiso para eliminar');
      return;
    }
    this.toast.warning('Profesional eliminado: ' + id);
  }

  updateStatus(id: string, status: Professional['status']): void {
    this.professionals.update((pros) =>
      pros.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  }
}
