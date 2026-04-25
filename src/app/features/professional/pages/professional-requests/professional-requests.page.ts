import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import type { RequestStatus } from '@data/api';
import { ProfessionalRequestsStore } from '@data/stores/professional-requests.store';

@Component({
  selector: 'app-professional-requests-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './professional-requests.page.html',
  styleUrl: './professional-requests.page.scss',
})
export class ProfessionalRequestsPage {
  readonly store = inject(ProfessionalRequestsStore);
  readonly tabIndex = signal(0);

  readonly filtered = computed(() => {
    switch (this.tabIndex()) {
      case 0:
        return this.store.pendingRequests();
      case 1:
        return this.store.contactedRequests();
      case 2:
        return this.store.inProgressRequests();
      case 3:
        return this.store.completedRequests();
      case 4:
        return this.store.rejectedRequests();
      case 5:
        return this.store.cancelledRequests();
      default:
        return this.store.requests();
    }
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.store.load({}, true).subscribe();
  }

  updateStatus(
    requestId: string,
    status: Extract<
      RequestStatus,
      'Contacted' | 'InProgress' | 'Rejected' | 'Completed' | 'Cancelled'
    >,
  ): void {
    this.store.updateStatus(requestId, status).subscribe();
  }

  chipClass(status: RequestStatus): string {
    switch (status) {
      case 'Pending':
        return 'chip-pending';
      case 'Contacted':
        return 'chip-contacted';
      case 'InProgress':
        return 'chip-in-progress';
      case 'Completed':
        return 'chip-completed';
      case 'Rejected':
        return 'chip-rejected';
      case 'Cancelled':
        return 'chip-cancelled';
      default:
        return '';
    }
  }
}
