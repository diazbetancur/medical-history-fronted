import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="legal-container">
      <div class="legal-content">
        <a mat-button routerLink="/" class="back-link">
          <mat-icon>arrow_back</mat-icon> Inicio
        </a>

        <h1>Política de Privacidad</h1>
        <p class="updated">Última actualización: junio 2026</p>

        <section>
          <h2>1. Información que recopilamos</h2>
          <p>
            Recopilamos información que proporcionas directamente: nombre, correo electrónico,
            teléfono y datos de perfil. También podemos recopilar información de uso de la
            plataforma de forma anónima y agregada.
          </p>
        </section>

        <section>
          <h2>2. Uso de la información</h2>
          <p>
            Utilizamos tu información para operar la plataforma, gestionar tu cuenta, enviarte
            notificaciones sobre citas y mejorar nuestros servicios. No vendemos ni cedemos
            tus datos personales a terceros con fines comerciales.
          </p>
        </section>

        <section>
          <h2>3. Datos de salud</h2>
          <p>
            Los datos de salud que compartas en la plataforma (historial, diagnósticos, notas
            clínicas) son tratados con el más alto nivel de confidencialidad y solo son
            accesibles por ti y los profesionales que expresamente autorices.
          </p>
        </section>

        <section>
          <h2>4. Compartir información</h2>
          <p>
            Compartimos información únicamente con los profesionales de salud que elijas para
            tus citas, y con proveedores de servicios técnicos necesarios para operar la
            plataforma, bajo acuerdos de confidencialidad.
          </p>
        </section>

        <section>
          <h2>5. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger tu información contra
            acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema es
            completamente seguro.
          </p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>
            Tienes derecho a acceder, rectificar y eliminar tus datos personales. Para ejercer
            estos derechos, contáctanos en
            <a href="mailto:privacidad@meditigo.com">privacidad&#64;meditigo.com</a>.
          </p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            Utilizamos cookies técnicas necesarias para el funcionamiento de la plataforma.
            No utilizamos cookies de seguimiento de terceros con fines publicitarios.
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
export class PrivacyPage {}
