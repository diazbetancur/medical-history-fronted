import { Pipe, PipeTransform } from '@angular/core';

/**
 * Traduce los nombres de rol del backend (inmutables, en inglés) a etiquetas
 * en español para la UI. Roles desconocidos se muestran tal cual (BUG-018r).
 */
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  superadmin: 'Super Administrador',
  client: 'Paciente',
  professional: 'Profesional',
  'altas medicos': 'Altas Médicos',
  tigoadmin: 'Admin Tigo',
};

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    if (!role) return '';
    return ROLE_LABELS[role.trim().toLowerCase()] ?? role;
  }
}
