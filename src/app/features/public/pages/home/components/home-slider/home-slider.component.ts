import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';

interface HomeSlide {
  bg1: string;
  bg2: string;
  dark: boolean;
  title: string;
  sub: string;
  img: string;
}

@Component({
  selector: 'app-home-slider',
  standalone: true,
  imports: [],
  templateUrl: './home-slider.component.html',
  styleUrl: './home-slider.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeSliderComponent {
  @Output() login = new EventEmitter<void>();
  @Output() register = new EventEmitter<void>();

  readonly healthIcons = ['💙', '🩺', '💊', '🧪', '🏥', '➕', '🦷', '🫀'];

  readonly slides: HomeSlide[] = [
    {
      bg1: '#eaf6ff',
      bg2: '#f2faff',
      dark: false,
      title: 'Conectamos pacientes y profesionales de la salud',
      sub: 'Encuentra especialistas, agenda citas y gestiona tu atención médica desde una sola plataforma.',
      img: 'images/home/slide-1.png',
    },
    {
      bg1: '#062845',
      bg2: '#041c33',
      dark: true,
      title: 'Citas médicas más simples y organizadas',
      sub: 'Agenda, confirma y administra consultas de forma rápida, segura y en tiempo real.',
      img: 'images/home/slide-2.png',
    },
    {
      bg1: '#eaf6ff',
      bg2: '#f2faff',
      dark: false,
      title: 'Nunca vuelvas a perder tu historial médico',
      sub: 'Centraliza toda tu información de salud y la de tu familia en un expediente digital seguro y accesible para futuras consultas.',
      img: 'images/home/slide-3.png',
    },
  ];
}
