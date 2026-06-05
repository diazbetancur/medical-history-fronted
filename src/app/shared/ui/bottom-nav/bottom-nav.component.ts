import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '@core/config/menu-config';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly items = input.required<MenuItem[]>();

  readonly navItems = computed(() =>
    this.items()
      .filter((item) => !item.isDivider && item.bottomNav)
      .slice(0, 5),
  );
}
