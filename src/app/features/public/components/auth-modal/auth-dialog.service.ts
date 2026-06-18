import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthModalComponent, AuthModalData } from './auth-modal.component';

/**
 * Punto único para abrir el modal de autenticación (login/registro).
 * Evita redirigir a la página `/login` desde flujos como "Agendar cita".
 */
@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Abre el modal de auth. `initialTab`: 0 = Iniciar sesión, 1 = Crear cuenta.
   * `afterClosed()` emite `true` cuando el usuario inició sesión con éxito.
   */
  open(initialTab = 0): MatDialogRef<AuthModalComponent, boolean> {
    return this.dialog.open<AuthModalComponent, AuthModalData, boolean>(
      AuthModalComponent,
      {
        data: { initialTab },
        width: '440px',
        maxWidth: '100vw',
        panelClass: 'auth-modal-panel',
        autoFocus: 'first-tabbable',
      },
    );
  }
}
