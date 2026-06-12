import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="legal-container">
      <a mat-button routerLink="/" class="back-link">
        <mat-icon>arrow_back</mat-icon> Inicio
      </a>

      <h1>Centro de Ayuda</h1>
      <p class="subtitle">Respuestas a las preguntas más frecuentes</p>

      <section class="faq-section">
        <h2>Pacientes</h2>
        <mat-accordion>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>¿Cómo agendo una cita?</mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Busca un profesional en la sección <strong>Buscar Médicos</strong>, ingresa a su
              perfil y selecciona una fecha y hora disponible. Recibirás una confirmación por
              correo electrónico.
            </p>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>¿Cómo cancelo una cita?</mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Ingresa a tu área de paciente, ve a <strong>Mis Citas</strong> y selecciona la
              cita que deseas cancelar. Puedes cancelar hasta 24 horas antes de la cita programada.
            </p>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>¿Es segura mi información médica?</mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Sí. Toda tu información médica está cifrada y solo es accesible por ti y los
              profesionales que expresamente autorices. Consulta nuestra
              <a routerLink="/privacy">Política de Privacidad</a> para más detalles.
            </p>
          </mat-expansion-panel>
        </mat-accordion>
      </section>

      <section class="faq-section">
        <h2>Profesionales</h2>
        <mat-accordion>
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>¿Cómo registro mi perfil profesional?</mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Crea una cuenta y luego ve a <strong>Activar área profesional</strong>. Completa
              tu perfil con tu especialidad, horarios y datos de contacto. Un administrador
              revisará tu solicitud en 24-48 horas.
            </p>
          </mat-expansion-panel>

          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>¿Cuánto cuesta usar la plataforma?</mat-panel-title>
            </mat-expansion-panel-header>
            <p>
              Durante la fase actual, el uso de MediTigo es gratuito para profesionales.
              Para consultar planes futuros, contáctanos en
              <a href="mailto:contacto@meditigo.com">contacto&#64;meditigo.com</a>.
            </p>
          </mat-expansion-panel>
        </mat-accordion>
      </section>

      <section class="contact-section">
        <h2>¿No encontraste tu respuesta?</h2>
        <p>Escríbenos y te responderemos a la brevedad.</p>
        <a mat-flat-button color="primary" href="mailto:soporte@meditigo.com">
          <mat-icon>email</mat-icon>
          Contactar soporte
        </a>
      </section>
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
    .subtitle { color: var(--mat-sys-on-surface-variant); margin: 0 0 40px; }
    .faq-section { margin-bottom: 40px; }
    h2 { font-size: 1.2rem; font-weight: 600; margin: 0 0 16px; }
    p { line-height: 1.7; margin: 0; }
    a { color: var(--mat-sys-primary); }
    .contact-section {
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
    }
    .contact-section p { color: var(--mat-sys-on-surface-variant); margin: 0 0 24px; }
  `],
})
export class HelpPage {}
