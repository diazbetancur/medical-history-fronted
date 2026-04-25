import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3 class="footer-title">MediTigo</h3>
            <p class="footer-description">
              Tu directorio médico de confianza. Conectando pacientes con los
              mejores profesionales de la salud.
            </p>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">Enlaces Rápidos</h4>
            <ul class="footer-links">
              <li><a routerLink="/">Inicio</a></li>
              <li><a routerLink="/search">Buscar Médicos</a></li>
              <li><a routerLink="/login">Iniciar Sesión</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">Soporte</h4>
            <ul class="footer-links">
              <li><a href="#">Ayuda</a></li>
              <li><a href="#">Términos de Servicio</a></li>
              <li><a href="#">Política de Privacidad</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">Contáctanos</h4>
            <ul class="footer-links">
              <li>
                <a href="mailto:contacto@meditigo.com"
                  >contacto&#64;meditigo.com</a
                >
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>
            &copy; {{ currentYear }} MediTigo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        padding: 64px 0 24px;
        background: var(--color-background-alt);
        border-top: 1px solid var(--color-border);
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .footer-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 32px;
        margin-bottom: 32px;
      }

      .footer-title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        color: var(--color-text-primary);
      }

      .footer-description {
        margin: 0;
        color: var(--color-text-secondary);
        line-height: 1.6;
      }

      .footer-heading {
        margin: 0 0 12px;
        color: var(--color-text-primary);
        font-size: 1rem;
      }

      .footer-links {
        list-style: none;
        margin: 0;
        padding: 0;

        li {
          margin-bottom: 8px;
        }

        a {
          color: var(--color-text-secondary);
          text-decoration: none;

          &:hover {
            color: var(--color-primary);
          }
        }
      }

      .footer-bottom {
        border-top: 1px solid var(--color-border);
        padding-top: 24px;
        text-align: center;

        p {
          margin: 0;
          color: var(--color-text-tertiary);
          font-size: 0.9rem;
        }
      }

      @media (max-width: 992px) {
        .footer-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 768px) {
        .container {
          padding: 0 16px;
        }

        .footer {
          padding: 48px 0 20px;
        }

        .footer-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }
    `,
  ],
})
export class PublicFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
