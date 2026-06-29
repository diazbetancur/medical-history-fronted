import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Input,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { PublicHomeProfessionalCardDto } from '../../../../../../public/models/public-home.dto';
import { ProfessionalCardComponent } from '../../../../components/professional-card/professional-card.component';

/**
 * Carrusel de profesionales destacados.
 *
 * Reusa Swiper (web components, como el `home-slider`). Muestra las tarjetas
 * "de a N" según el ancho de pantalla y, cuando hay más profesionales que los
 * visibles, se vuelve deslizable (swipe en touch + flechas en escritorio).
 * Avanza de a una (`slidesPerGroup: 1`) y NO tiene autoplay ni loop.
 */
@Component({
  selector: 'app-featured-doctors',
  standalone: true,
  imports: [ProfessionalCardComponent],
  templateUrl: './featured-doctors.component.html',
  styleUrl: './featured-doctors.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FeaturedDoctorsComponent {
  @Input({ required: true }) professionals: PublicHomeProfessionalCardDto[] = [];

  @ViewChild('swiperEl') private swiperRef?: ElementRef<HTMLElement>;

  constructor() {
    // Registra los web components de Swiper de forma diferida (chunk lazy) y
    // solo en el navegador, y luego inicializa con la config responsiva.
    afterNextRender(() => {
      import('swiper/element/bundle').then(({ register }) => {
        register();
        this.initSwiper();
      });
    });
  }

  private initSwiper(): void {
    const el = this.swiperRef?.nativeElement as
      | (HTMLElement & { initialize?: () => void })
      | undefined;
    if (!el) return;

    // Parámetros por objeto (breakpoints) → se asignan como propiedades del
    // elemento y luego se llama a initialize() (patrón de Swiper Element con
    // init="false").
    Object.assign(el, {
      slidesPerView: 1.2,
      spaceBetween: 24,
      slidesPerGroup: 1,
      navigation: true,
      centerInsufficientSlides: true,
      breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    });

    el.initialize?.();
  }
}
