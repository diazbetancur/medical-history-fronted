import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Swiper se registra de forma diferida en el componente del slider del home
// (chunk lazy), para no inflar el bundle inicial.

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
