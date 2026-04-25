/**
 * Toast Service
 *
 * Wrapper around MatSnackBar for showing user-friendly notifications
 */

import { inject, Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG: MatSnackBarConfig = {
  duration: 5000,
  horizontalPosition: 'end',
  verticalPosition: 'top',
};

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Show success toast (green)
   */
  success(message: string, action = 'Cerrar'): MatSnackBarRef<unknown> {
    return this.show(message, 'success', action);
  }

  /**
   * Show error toast (red)
   */
  error(message: string, action = 'Cerrar'): MatSnackBarRef<unknown> {
    return this.show(message, 'error', action);
  }

  /**
   * Show warning toast (orange)
   */
  warning(message: string, action = 'Cerrar'): MatSnackBarRef<unknown> {
    return this.show(message, 'warning', action);
  }

  /**
   * Show info toast (blue)
   */
  info(message: string, action = 'Cerrar'): MatSnackBarRef<unknown> {
    return this.show(message, 'info', action);
  }

  /**
   * Show generic toast with custom config
   */
  show(
    message: string,
    type: ToastType = 'info',
    action = 'Cerrar',
    config: Partial<MatSnackBarConfig> = {},
  ): MatSnackBarRef<unknown> {
    const finalConfig: MatSnackBarConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      panelClass: [`toast-${type}`],
    };

    return this.snackBar.open(message, action, finalConfig);
  }

  /**
   * Dismiss all active toasts
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
