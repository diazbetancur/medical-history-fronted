import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="legal-container">
      <div class="legal-content">
        <a mat-button routerLink="/" class="back-link">
          <mat-icon>arrow_back</mat-icon> Inicio
        </a>

        <h1>Términos de Servicio</h1>
        <p class="updated">Última actualización: junio 2026</p>

        <section>
          <h2>1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar MediTigo, aceptas quedar vinculado por estos Términos de Servicio.
            Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
          </p>
        </section>

        <section>
          <h2>2. Descripción del servicio</h2>
          <p>
            MediTigo es una plataforma de directorio médico que facilita la búsqueda de profesionales
            de salud y la gestión de citas médicas. No somos un proveedor de servicios médicos y no
            prestamos servicios de atención en salud.
          </p>
        </section>

        <section>
          <h2>3. Uso de la plataforma</h2>
          <p>
            Te comprometes a utilizar la plataforma únicamente para fines lícitos y de acuerdo con
            estos términos. Está prohibido el uso de la plataforma para actividades fraudulentas,
            ilegales o que dañen a otros usuarios.
          </p>
        </section>

        <section>
          <h2>4. Cuentas de usuario</h2>
          <p>
            Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.
            Notifícanos de inmediato ante cualquier uso no autorizado de tu cuenta.
          </p>
        </section>

        <section>
          <h2>5. Limitación de responsabilidad</h2>
          <p>
            MediTigo no se responsabiliza por la calidad de los servicios médicos prestados por
            los profesionales listados en la plataforma. La relación médico-paciente es exclusiva
            entre el paciente y el profesional de salud.
          </p>
        </section>

        <section>
          <h2>6. Cambios en los términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entrarán en vigencia al momento de su publicación en la plataforma.
          </p>
        </section>

        <section>
          <h2>7. Contacto</h2>
          <p>
            Para consultas sobre estos términos, contáctanos en
            <a href="mailto:legal@meditigo.com">legal&#64;meditigo.com</a>.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .legal-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
    .back-link { margin-bottom: 24px; }
    h1 { font-size: 2rem; font-weight: 700; margin: 0 0 8px; }
    .updated { color: var(--mat-sys-on-surface-variant); margin: 0 0 40px; }
    section { margin-bottom: 32px; }
    h2 { font-size: 1.2rem; font-weight: 600; margin: 0 0 12px; }
    p { line-height: 1.7; color: var(--mat-sys-on-surface-variant); margin: 0; }
    a { color: var(--mat-sys-primary); }
  `],
})
export class TermsPage {}
