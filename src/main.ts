import { bootstrapApplication } from '@angular/platform-browser';
import { register as registerSwiper } from 'swiper/element/bundle';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

registerSwiper();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
