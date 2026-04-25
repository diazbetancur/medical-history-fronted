import { Injectable } from '@angular/core';

const SESSION_KEY = 'auth_intent_professional';

/**
 * AuthIntentService
 *
 * Persiste en sessionStorage la intención del usuario:
 * ¿viene de "Soy Médico" (true) o de "Iniciar Sesión" genérico (false)?
 * Se usa para pre-seleccionar el contexto en login y registro del modal.
 */
@Injectable({ providedIn: 'root' })
export class AuthIntentService {
  setAsProfessional(value: boolean): void {
    if (value) {
      sessionStorage.setItem(SESSION_KEY, '1');
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  getAsProfessional(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
