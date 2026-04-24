import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpLoadingService } from '@core/http';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: './global-loader.component.html',
  styleUrl: './global-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent {
  protected readonly isLoading = inject(HttpLoadingService).isLoading;
}
