import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './profile-edit.page.html',
  styleUrl: './profile-edit.page.scss',
})
export class ProfileEditPageComponent {
  private readonly toast = inject(ToastService);

  profile = {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+52 55 1234 5678',
    specialty: 'Plomero Profesional',
    description:
      'Profesional con más de 10 años de experiencia en instalaciones y reparaciones de plomería.',
    services: [
      'Reparación de fugas',
      'Instalación de baños',
      'Destape de tuberías',
    ],
  };

  newService = '';

  addService(): void {
    if (
      this.newService.trim() &&
      !this.profile.services.includes(this.newService.trim())
    ) {
      this.profile.services.push(this.newService.trim());
      this.newService = '';
    }
  }

  removeService(service: string): void {
    this.profile.services = this.profile.services.filter((s) => s !== service);
  }

  saveProfile(): void {
    // Mock save
    this.toast.success('Perfil guardado exitosamente');
  }
}
