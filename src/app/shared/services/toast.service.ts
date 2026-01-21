import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Toast types for visual differentiation
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast configuration options
 */
export interface ToastOptions {
  duration?: number;
  action?: string;
  type?: ToastType;
}

/**
 * Default configurations per toast type
 */
const TOAST_DEFAULTS: Record<ToastType, Partial<MatSnackBarConfig>> = {
  success: {
    duration: 4000,
    panelClass: ['toast-success'],
  },
  error: {
    duration: 6000,
    panelClass: ['toast-error'],
  },
  warning: {
    duration: 5000,
    panelClass: ['toast-warning'],
  },
  info: {
    duration: 4000,
    panelClass: ['toast-info'],
  },
};

/**
 * Toast Service
 *
 * Centralized service for displaying toast notifications across the application.
 * Provides consistent styling and behavior for success, error, warning, and info messages.
 *
 * @example
 * ```typescript
 * // Success message
 * this.toast.success('Cambios guardados correctamente');
 *
 * // Error message
 * this.toast.error('Error al guardar los datos');
 *
 * // With custom action
 * this.toast.success('Perfil actualizado', { action: 'Ver' });
 *
 * // Warning
 * this.toast.warning('Sesión por expirar');
 *
 * // Info
 * this.toast.info('Nueva versión disponible');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Show a success toast
   */
  success(message: string, options?: ToastOptions): void {
    this.show(message, { ...options, type: 'success' });
  }

  /**
   * Show an error toast
   */
  error(message: string, options?: ToastOptions): void {
    this.show(message, { ...options, type: 'error' });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, options?: ToastOptions): void {
    this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Show an info toast
   */
  info(message: string, options?: ToastOptions): void {
    this.show(message, { ...options, type: 'info' });
  }

  /**
   * Show a generic toast with custom configuration
   */
  show(message: string, options: ToastOptions = {}): void {
    const type = options.type ?? 'info';
    const defaults = TOAST_DEFAULTS[type];
    const action = options.action ?? 'Cerrar';

    this.snackBar.open(message, action, {
      duration: options.duration ?? defaults.duration,
      panelClass: defaults.panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Dismiss any currently displayed toast
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
