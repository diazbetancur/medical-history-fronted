import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, map } from 'rxjs';
import { AuthStore } from '@core/auth';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';
import { BottomNavComponent } from '@shared/ui/bottom-nav/bottom-nav.component';

/**
 * Diálogo informativo para profesionales recién registrados
 * que aún no han completado su perfil profesional.
 */
@Component({
  selector: 'app-profile-required-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div mat-dialog-title class="dialog-header">
      <mat-icon color="primary">manage_accounts</mat-icon>
      <span>Completa tu perfil profesional</span>
    </div>
    <mat-dialog-content class="dialog-body">
      <p>
        Bienvenido al área profesional. Para acceder a
        <strong>Mis Citas, Disponibilidad y Pacientes</strong>,
        primero debes completar tu perfil profesional.
      </p>
      <p>
        Una vez guardado, todas las secciones estarán disponibles
        automáticamente.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" [mat-dialog-close]="true">
        Entendido, voy a completarlo
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dialog-body p {
        margin-bottom: 10px;
        line-height: 1.6;
      }
    `,
  ],
})
export class ProfileRequiredDialogComponent {}

@Component({
  selector: 'app-professional-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    LayoutTopbarComponent,
    SidebarComponent,
    BottomNavComponent,
  ],
  templateUrl: './professional-layout.component.html',
  styleUrl: './professional-layout.component.scss',
})
export class ProfessionalLayoutComponent implements OnInit {
  @ViewChild('drawer') private readonly drawer!: MatSidenav;

  readonly menuService = inject(MenuService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private static readonly WELCOME_SESSION_KEY = 'pro_profile_welcome_shown';

  readonly isMobile = toSignal(
    this.breakpointObserver
      .observe('(max-width: 768px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  ngOnInit(): void {
    const ctx = this.authStore
      .availableContexts()
      .find((c) => c.type === 'PROFESSIONAL');
    if (ctx) this.authStore.switchContext(ctx);
  }

  constructor() {
    afterNextRender(() => {
      // Mostrar modal de bienvenida si no tiene perfil
      const user = this.authStore.user();
      if (user && !user.hasProfessionalProfile) {
        if (
          !sessionStorage.getItem(
            ProfessionalLayoutComponent.WELCOME_SESSION_KEY,
          )
        ) {
          sessionStorage.setItem(
            ProfessionalLayoutComponent.WELCOME_SESSION_KEY,
            '1',
          );
          this.dialog.open(ProfileRequiredDialogComponent, {
            width: '460px',
            maxWidth: '96vw',
            disableClose: false,
          });
        }
      }

      // Cerrar sidenav al navegar en mobile
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          if (this.isMobile()) {
            this.drawer?.close();
          }
        });
    });
  }
}
