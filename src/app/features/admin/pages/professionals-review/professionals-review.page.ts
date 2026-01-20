import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

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
    MatSnackBarModule,
  ],
  templateUrl: './professionals-review.page.html',
  styleUrl: './professionals-review.page.scss',
})
export class ProfessionalsReviewPageComponent {
  displayedColumns = ['name', 'specialty', 'status', 'createdAt', 'actions'];

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

  constructor(private snackBar: MatSnackBar) {}

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      verified: 'Verificado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  }

  verifyPro(id: string): void {
    this.updateStatus(id, 'verified');
    this.snackBar.open('Profesional verificado exitosamente', 'Cerrar', {
      duration: 3000,
    });
  }

  rejectPro(id: string): void {
    this.updateStatus(id, 'rejected');
    this.snackBar.open('Profesional rechazado', 'Cerrar', { duration: 3000 });
  }

  private updateStatus(id: string, status: Professional['status']): void {
    this.professionals.update((pros) =>
      pros.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }
}
