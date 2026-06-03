import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ContextDto } from '@core/models';

export interface ContextSelectionDialogData {
  contexts: ContextDto[];
  currentContext: ContextDto | null;
}

@Component({
  selector: 'app-context-selection-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './context-selection-dialog.component.html',
  styleUrl: './context-selection-dialog.component.scss',
})
export class ContextSelectionDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ContextSelectionDialogComponent, ContextDto>,
  );

  readonly data = inject<ContextSelectionDialogData>(MAT_DIALOG_DATA);

  selectContext(context: ContextDto): void {
    this.dialogRef.close(context);
  }

  getContextIcon(type: ContextDto['type']): string {
    switch (type) {
      case 'ADMIN':
        return 'admin_panel_settings';
      case 'PROFESSIONAL':
        return 'medical_services';
      case 'PATIENT':
        return 'person';
      default:
        return 'dashboard';
    }
  }

  getContextLabel(type: ContextDto['type']): string {
    switch (type) {
      case 'ADMIN':
        return 'Administrativo';
      case 'PROFESSIONAL':
        return 'Profesional';
      case 'PATIENT':
        return 'Paciente';
      default:
        return type;
    }
  }

  getContextDescription(type: ContextDto['type']): string {
    switch (type) {
      case 'ADMIN':
        return 'Gestionar usuarios, catálogos y solicitudes.';
      case 'PROFESSIONAL':
        return 'Administrar perfil, disponibilidad, citas y pacientes.';
      case 'PATIENT':
        return 'Agendar citas y gestionar tu información médica.';
      default:
        return 'Continuar con este contexto.';
    }
  }

  isCurrentContext(context: ContextDto): boolean {
    const currentContext = this.data.currentContext;
    return (
      !!currentContext &&
      currentContext.type === context.type &&
      currentContext.id === context.id
    );
  }
}
