import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '@shared/services';
import { finalize } from 'rxjs';
import { AddDependentDialogComponent } from './dialogs/add-dependent-dialog.component';
import { FamilyGroupService } from '../../services/family-group.service';
import {
  AddMemberByDocumentRequest,
  FamilyGroupDetail,
} from '../../services/family-group.models';

@Component({
  selector: 'app-family-group-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './family-group-detail.page.html',
  styleUrl: './family-group-detail.page.scss',
})
export class FamilyGroupDetailPage implements OnInit {
  private readonly service = inject(FamilyGroupService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly detail = signal<FamilyGroupDetail | null>(null);

  private groupId = '';

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service
      .getDetail(this.groupId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (d) => this.detail.set(d),
        error: (e) => this.toast.error(e.message || 'No se pudo cargar el grupo'),
      });
  }

  openAddMember(): void {
    const ref = this.dialog.open<AddDependentDialogComponent, void, AddMemberByDocumentRequest | null>(
      AddDependentDialogComponent,
      { width: '480px', maxWidth: '95vw', disableClose: true },
    );
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.service.addMember(this.groupId, payload).subscribe({
        next: (res) => {
          if (res.outcome === 'JoinRequestSent') {
            this.toast.success('Solicitud de vinculación enviada');
          } else {
            this.toast.success('Miembro agregado');
          }
          this.load();
        },
        error: (e) => this.toast.error(e.message || 'No se pudo agregar el miembro'),
      });
    });
  }
}
