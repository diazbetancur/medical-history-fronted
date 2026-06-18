import { Pipe, PipeTransform } from '@angular/core';

/**
 * Normaliza el prefijo "Dr"/"Dra" del nombre de un profesional para que sea
 * uniforme con punto ("Dr." / "Dra."), sin alterar el resto del nombre ni los
 * nombres que no empiezan por ese prefijo (BUG-089, solo presentación).
 *
 * "Dr Alex Diaz"        -> "Dr. Alex Diaz"
 * "Dra Valeria Mendoza" -> "Dra. Valeria Mendoza"
 * "Dr. Alex"            -> "Dr. Alex"   (sin cambios)
 * "Drake House"         -> "Drake House" (no es prefijo, no se toca)
 */
@Pipe({ name: 'doctorName', standalone: true })
export class DoctorNamePipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    if (!name) return '';
    const trimmed = name.trim();
    // "dra" antes que "dr" para no cortar el prefijo femenino.
    const match = /^(dra|dr)\.?\s+(.+)$/i.exec(trimmed);
    if (!match) return trimmed;
    const prefix = match[1].toLowerCase() === 'dra' ? 'Dra.' : 'Dr.';
    return `${prefix} ${match[2]}`;
  }
}
