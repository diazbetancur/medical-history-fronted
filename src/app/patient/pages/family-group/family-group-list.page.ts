import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ToastService } from '@shared/services';
import { finalize } from 'rxjs';
import { CreateGroupDialogComponent } from './dialogs/create-group-dialog.component';
import { FamilyGroupHelpPanelComponent } from './components/family-group-help-panel/family-group-help-panel.component';
import { FamilyGroupService } from '../../services/family-group.service';
import { FamilyGroupSummary } from '../../services/family-group.models';

@Component({
  selector: 'app-family-group-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FamilyGroupHelpPanelComponent,
  ],
  templateUrl: './family-group-list.page.html',
  styleUrl: './family-group-list.page.scss',
})
export class FamilyGroupListPage implements OnInit {
  private readonly service = inject(FamilyGroupService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly groups = signal<FamilyGroupSummary[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service
      .getMyGroups()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (g) => this.groups.set(g),
        error: (e) => this.toast.error(e.message || 'No se pudieron cargar los grupos'),
      });
  }

  openCreate(): void {
    const ref = this.dialog.open<CreateGroupDialogComponent, void, string | null>(
      CreateGroupDialogComponent,
      { width: '420px', maxWidth: '95vw', disableClose: true },
    );
    ref.afterClosed().subscribe((name) => {
      if (!name) return;
      this.service.createGroup({ name }).subscribe({
        next: (g) => {
          this.toast.success('Grupo creado');
          this.router.navigate(['/patient/family-group', g.id]);
        },
        error: (e) => this.toast.error(e.message || 'No se pudo crear el grupo'),
      });
    });
  }

  open(group: FamilyGroupSummary): void {
    this.router.navigate(['/patient/family-group', group.id]);
  }
}
