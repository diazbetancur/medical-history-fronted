import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ContextDto } from '@core/models';
import { AuthStore } from './auth.store';

/**
 * Post-Login Navigation Service
 *
 * Maneja la navegación después del login basándose en el contexto del usuario.
 *
 * Lógica:
 * 1. Si hay currentContext persistido → navegar a su área
 * 2. Si hay defaultContext → navegar a su área
 * 3. Si tiene múltiples contextos → navegar al primero disponible
 * 4. Fallback → /patient
 *
 * @example Uso en LoginPage
 * ```typescript
 * this.authApi.login(credentials).subscribe({
 *   next: (response) => {
 *     this.authStore.setToken(response.token, response.expiresAt);
 *     this.authStore.loadMe().subscribe({
 *       next: () => {
 *         this.postLoginNavigation.navigateByContext();
 *       }
 *     });
 *   }
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class PostLoginNavigationService {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  /**
   * Navigate to the appropriate area based on user's context
   *
   * Priority:
   * 1. Current context (if set)
   * 2. Default context (from user.defaultContext)
   * 3. First available context
   * 4. Fallback to /patient
   */
  navigateByContext(): void {
    const currentContext = this.authStore.currentContext();
    const user = this.authStore.user();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // 1. Si ya hay un currentContext, navegar a su área
    if (currentContext) {
      const path = this.getContextPath(currentContext.type);
      this.router.navigate([path]);
      return;
    }

    // 2. Si hay defaultContext, navegar a su área
    if (user.defaultContext) {
      const path = this.getContextPath(user.defaultContext.type);
      this.authStore.switchContext(user.defaultContext);
      this.router.navigate([path]);
      return;
    }

    // 3. Si tiene contextos disponibles, navegar al primero
    const availableContexts = user.contexts || [];
    if (availableContexts.length > 0) {
      const firstContext = availableContexts[0];
      const path = this.getContextPath(firstContext.type);
      this.authStore.switchContext(firstContext);
      this.router.navigate([path]);
      return;
    }

    // 4. Fallback a /patient
    this.router.navigate(['/patient']);
  }

  /**
   * Navigate to a specific context area
   */
  navigateTo(context: ContextDto): void {
    const path = this.getContextPath(context.type);
    this.authStore.switchContext(context);
    this.router.navigate([path]);
  }

  /**
   * Get the route path for a context type
   */
  private getContextPath(contextType: ContextDto['type']): string {
    switch (contextType) {
      case 'ADMIN':
        return '/admin';
      case 'PROFESSIONAL':
        return '/professional';
      case 'PATIENT':
        return '/patient';
      default:
        return '/patient';
    }
  }

  /**
   * Check if user has access to a specific context
   */
  hasContextAccess(contextType: ContextDto['type']): boolean {
    const user = this.authStore.user();
    if (!user) return false;

    return user.contexts.some((ctx) => ctx.type === contextType);
  }

  /**
   * Get all available context paths for the current user
   */
  getAvailableContextPaths(): string[] {
    const user = this.authStore.user();
    if (!user) return [];

    return user.contexts.map((ctx) => this.getContextPath(ctx.type));
  }
}
