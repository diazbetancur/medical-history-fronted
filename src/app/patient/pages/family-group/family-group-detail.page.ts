import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import { finalize } from 'rxjs';
import { AddDependentDialogComponent } from './dialogs/add-dependent-dialog.component';
import { EditDependentNameDialogComponent } from './dialogs/edit-dependent-name-dialog.component';
import { ActingPatientStore } from '../../services/acting-patient.store';
import { FamilyGroupService } from '../../services/family-group.service';
import {
  AddMemberByDocumentRequest,
  FamilyGroupDetail,
  FamilyGroupMember,
  FamilyGroupPendingRequest,
} from '../../services/family-group.models';

@Component({
  selector: 'app-family-group-detail',
  standalone: true,
  imports: [
    DatePipe,
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
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly authStore = inject(AuthStore);
  private readonly actingPatient = inject(ActingPatientStore);

  readonly isLoading = signal(true);
  readonly detail = signal<FamilyGroupDetail | null>(null);
  readonly pendingRequests = signal<FamilyGroupPendingRequest[]>([]);

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
        next: (d) => {
          this.detail.set(d);
          if (d.iAmAdmin) {
            this.loadPendingRequests();
          } else {
            this.pendingRequests.set([]);
          }
        },
        error: (e) => this.toast.error(e.message || 'No se pudo cargar el grupo'),
      });
  }

  private loadPendingRequests(): void {
    this.service.getGroupRequests(this.groupId).subscribe({
      next: (reqs) => this.pendingRequests.set(reqs),
      error: () => this.pendingRequests.set([]),
    });
  }

  cancelRequest(r: FamilyGroupPendingRequest): void {
    this.confirm(
      'Cancelar solicitud',
      `¿Cancelar la solicitud de vinculación de ${r.patientFullName}?`,
      'Cancelar solicitud',
      'cancel',
    ).subscribe((ok) => {
      if (!ok) return;
      this.service.cancelRequest(this.groupId, r.id).subscribe({
        next: () => {
          this.toast.success('Solicitud cancelada');
          this.load();
        },
        error: (e) => this.toast.error(e.message || 'No se pudo cancelar la solicitud'),
      });
    });
  }

  /**
   * El miembro es "yo" si tiene cuenta y su nombre coincide con el del usuario
   * autenticado. (El backend no expone un flag isMe en el detalle; usamos el
   * nombre como proxy disponible en el cliente.)
   */
  isCurrentUser(member: FamilyGroupMember): boolean {
    const myName = this.authStore.userName();
    return !!member.hasAccount && !!myName && member.fullName === myName;
  }

  manage(member: FamilyGroupMember): void {
    this.actingPatient.set({
      patientProfileId: member.patientProfileId,
      fullName: member.fullName,
    });
    this.router.navigate(['/patient/managed', member.patientProfileId]);
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

  promote(m: FamilyGroupMember): void {
    this.service.promoteMember(this.groupId, m.memberId).subscribe({
      next: () => {
        this.toast.success('Miembro promovido a administrador');
        this.load();
      },
      error: (e) => this.toast.error(e.message || 'No se pudo promover'),
    });
  }

  demote(m: FamilyGroupMember): void {
    this.service.demoteMember(this.groupId, m.memberId).subscribe({
      next: () => {
        this.toast.success('Administrador bajado a miembro');
        this.load();
      },
      error: (e) => this.toast.error(e.message || 'No se pudo bajar'),
    });
  }

  remove(m: FamilyGroupMember): void {
    this.confirm(
      'Sacar del grupo',
      `¿Sacar a ${m.fullName} del grupo? Perderá el acceso.`,
      'Sacar',
      'person_remove',
    ).subscribe((ok) => {
      if (!ok) return;
      this.service.removeMember(this.groupId, m.memberId).subscribe({
        next: () => {
          this.toast.success('Miembro retirado del grupo');
          this.load();
        },
        error: (e) => this.toast.error(e.message || 'No se pudo sacar al miembro'),
      });
    });
  }

  editName(member: FamilyGroupMember): void {
    const ref = this.dialog.open<EditDependentNameDialogComponent, { currentName: string }, string | null>(
      EditDependentNameDialogComponent,
      { width: '460px', maxWidth: '95vw', data: { currentName: member.fullName } },
    );
    ref.afterClosed().subscribe((newName) => {
      const trimmed = (newName ?? '').trim();
      if (!trimmed || trimmed === member.fullName) return;
      this.service.updateDependentName(this.groupId, member.patientProfileId, trimmed).subscribe({
        next: () => {
          this.toast.success('Nombre actualizado');
          this.load();
        },
        error: (e) => this.toast.error(e.message || 'No se pudo actualizar el nombre'),
      });
    });
  }

  leave(): void {
    this.confirm(
      'Salir del grupo',
      'Si eres el último administrador, el grupo se eliminará. ¿Continuar?',
      'Salir',
      'logout',
    ).subscribe((ok) => {
      if (!ok) return;
      this.service.leaveGroup(this.groupId).subscribe({
        next: (res) => {
          this.toast.success(res.groupDeleted ? 'Grupo eliminado' : 'Saliste del grupo');
          this.router.navigate(['/patient/family-group']);
        },
        error: (e) => this.toast.error(e.message || 'No se pudo salir del grupo'),
      });
    });
  }

  private confirm(title: string, message: string, confirmText = 'Eliminar', icon = 'delete_forever') {
    return this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title,
          message,
          confirmText,
          cancelText: 'Cancelar',
          confirmColor: 'warn',
          icon,
        },
      })
      .afterClosed();
  }
}
