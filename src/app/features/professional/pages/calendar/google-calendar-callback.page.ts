import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-google-calendar-callback',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './google-calendar-callback.page.html',
})
export class GoogleCalendarCallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly status = signal<'success' | 'error'>('success');
  protected readonly calendar = signal<string>('');
  protected readonly imported = signal<string>('0');

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.status.set(q.get('status') === 'error' ? 'error' : 'success');
    this.calendar.set(q.get('calendar') ?? '');
    this.imported.set(q.get('imported') ?? '0');
  }

  protected goToSettings() { this.router.navigate(['/professional/calendar']); }
}
