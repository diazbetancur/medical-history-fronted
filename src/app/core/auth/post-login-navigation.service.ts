import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ContextDto, CurrentUserDto } from '@core/models';
import { AuthStore } from './auth.store';

export interface PostLoginNavigationOptions {
  preferProfessional?: boolean;
}

export interface PostLoginTarget {
  context: ContextDto;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class PostLoginNavigationService {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  navigateByContext(
    options: PostLoginNavigationOptions = {},
  ): PostLoginTarget | null {
    const user = this.authStore.user();

    if (!user) {
      this.router.navigate(['/login']);
      return null;
    }

    const target = this.resolveNavigationTarget(user, options);
    if (!target) {
      this.router.navigate(['/patient']);
      return null;
    }

    this.authStore.switchContext(target.context);
    this.router.navigate([target.path]);
    return target;
  }

  navigateTo(context: ContextDto): void {
    const path = this.getContextPath(context.type);
    this.authStore.switchContext(context);
    this.router.navigate([path]);
  }

  hasContextAccess(contextType: ContextDto['type']): boolean {
    const user = this.authStore.user();
    if (!user) {
      return false;
    }

    return user.contexts.some((ctx) => ctx.type === contextType);
  }

  getAvailableContextPaths(): string[] {
    const user = this.authStore.user();
    if (!user) {
      return [];
    }

    return user.contexts.map((ctx) => this.getContextPath(ctx.type));
  }

  private resolveNavigationTarget(
    user: CurrentUserDto,
    options: PostLoginNavigationOptions,
  ): PostLoginTarget | null {
    const availableContexts = user.contexts || [];
    const currentContext = this.authStore.currentContext();
    const adminContext = availableContexts.find((ctx) => ctx.type === 'ADMIN');
    const professionalContext = availableContexts.find(
      (ctx) => ctx.type === 'PROFESSIONAL',
    );
    const patientContext = availableContexts.find(
      (ctx) => ctx.type === 'PATIENT',
    );

    if (this.hasPrivilegedAccess(user)) {
      return this.buildTarget(
        adminContext ?? user.defaultContext ?? availableContexts[0] ?? null,
        user,
      );
    }

    if (options.preferProfessional && professionalContext) {
      return this.buildTarget(professionalContext, user);
    }

    if (
      currentContext &&
      availableContexts.some((ctx) => this.isSameContext(ctx, currentContext))
    ) {
      return this.buildTarget(currentContext, user);
    }

    if (user.defaultContext) {
      const matchedDefault = availableContexts.find((ctx) =>
        this.isSameContext(ctx, user.defaultContext),
      );
      return this.buildTarget(matchedDefault ?? user.defaultContext, user);
    }

    if (patientContext) {
      return this.buildTarget(patientContext, user);
    }

    if (professionalContext) {
      return this.buildTarget(professionalContext, user);
    }

    if (adminContext) {
      return this.buildTarget(adminContext, user);
    }

    return this.buildTarget(availableContexts[0] ?? null, user);
  }

  private buildTarget(
    context: ContextDto | null,
    _user: CurrentUserDto,
  ): PostLoginTarget | null {
    if (!context) {
      return null;
    }

    return {
      context,
      path: this.getContextPath(context.type),
    };
  }

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

  private hasPrivilegedAccess(user: CurrentUserDto): boolean {
    if (user.contexts.some((context) => context.type === 'ADMIN')) {
      return true;
    }

    return user.roles.some((role) => {
      const normalizedRole = String(role ?? '')
        .trim()
        .toUpperCase();
      return (
        normalizedRole.length > 0 &&
        !['CLIENT', 'PATIENT', 'PROFESSIONAL'].includes(normalizedRole)
      );
    });
  }

  private isSameContext(left: ContextDto, right: ContextDto): boolean {
    return left.type === right.type && left.id === right.id;
  }
}
