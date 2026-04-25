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
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  /**
   * Menu items to display in the sidebar
   */
  @Input({ required: true }) items: MenuItem[] = [];
}
