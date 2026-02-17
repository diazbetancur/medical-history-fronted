import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '@core/config/menu-config';

/**
 * Reusable Sidebar Component
 *
 * Renders a navigation menu from an array of MenuItem objects.
 * Handles dividers, icons, and active route highlighting.
 *
 * Usage:
 * ```html
 * <app-sidebar [items]="menuItems" />
 * ```
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <mat-nav-list>
      @for (item of items; track item.route) {
        @if (item.isDivider) {
          <mat-divider />
        } @else {
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="
              item.exactMatch ? { exact: true } : { exact: false }
            "
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        }
      }
    </mat-nav-list>
  `,
  styles: `
    :host {
      display: block;
    }

    mat-nav-list {
      padding-top: 0;
    }

    a[mat-list-item] {
      color: var(--color-text-primary);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--color-surface-hover);
      }

      &.active {
        background-color: rgba(63, 81, 181, 0.08);
        color: var(--color-primary);

        mat-icon {
          color: var(--color-primary);
        }
      }
    }

    mat-icon {
      color: var(--color-text-secondary);
    }

    mat-divider {
      margin: 8px 0;
    }
  `,
})
export class SidebarComponent {
  /**
   * Menu items to display in the sidebar
   */
  @Input({ required: true }) items: MenuItem[] = [];
}
