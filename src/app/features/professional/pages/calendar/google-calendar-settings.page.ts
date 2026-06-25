import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleCalendarApi } from '@data/api/google-calendar.api';
import { CalendarConnectionStatus } from '@data/models/google-calendar.models';
import { ToastService } from '@shared/index';

@Component({
  selector: 'app-google-calendar-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './google-calendar-settings.page.html',
  styleUrl: './google-calendar-settings.page.scss',
})
export class GoogleCalendarSettingsPage implements OnInit {
  private readonly api = inject(GoogleCalendarApi);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly connections = signal<CalendarConnectionStatus[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.api.getConnections().subscribe({
      next: (c) => {
        this.connections.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected connect(): void {
    this.api.getConnectUrl().subscribe({
      next: (r) => {
        window.location.href = r.authorizationUrl;
      },
      error: () => this.toast.error('No se pudo iniciar la conexión con Google.'),
    });
  }

  protected disconnect(id: string): void {
    this.api.disconnect(id).subscribe({
      next: () => {
        this.toast.success('Calendario desconectado.');
        this.refresh();
      },
      error: () => this.toast.error('No se pudo desconectar.'),
    });
  }
}
