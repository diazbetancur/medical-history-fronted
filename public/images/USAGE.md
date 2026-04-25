# Image Usage Guide

Guía rápida para usar las imágenes públicas en MediTigo.

## 📁 Estructura

```
public/images/
├── home/          → Imágenes del home page
├── doctors/       → Fotos de doctores
├── specialties/   → Iconos de especialidades
└── logo/          → Logos de la app
```

## 🖼️ Uso en Componentes

### En Templates (HTML)

```html
<!-- Hero background -->
<div class="hero" [style.background-image]="'url(/images/home/hero-bg.webp)'">
  <!-- content -->
</div>

<!-- Logo -->
<img src="/images/logo/logo.svg" alt="MediTigo" height="40">

<!-- Doctor profile -->
<img 
  [src]="doctor.avatarUrl || '/images/doctors/doctor-placeholder-male.webp'" 
  [alt]="doctor.fullName"
  class="doctor-avatar">

<!-- Specialty icon -->
<img src="/images/specialties/cardiology.svg" alt="Cardiología">
```

### En Estilos (SCSS)

```scss
.hero {
  background-image: url('/images/home/hero-bg.webp');
  background-size: cover;
  background-position: center;
}

.logo-container {
  background: url('/images/logo/logo-icon.svg') no-repeat center;
  background-size: contain;
}
```

### En TypeScript

```typescript
export class MyComponent {
  // Fallback para imágenes
  getDoctorImage(doctor: Doctor): string {
    return doctor.avatarUrl || '/images/doctors/doctor-placeholder-male.webp';
  }

  // Cargar imagen dinámicamente
  getSpecialtyIcon(specialtySlug: string): string {
    return `/images/specialties/${specialtySlug}.svg`;
  }
}
```

## 🎨 Ejemplos por Sección

### Home Page Hero

```scss
// home.page.scss
.hero {
  background: 
    linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9)),
    url('/images/home/hero-bg.webp');
  background-size: cover;
  background-position: center;
  min-height: 600px;
}
```

### Doctor Cards

```typescript
// professional-card.component.ts
get imageUrl(): string {
  return this.professional.avatarUrl || 
    '/images/doctors/doctor-placeholder-' + 
    (this.professional.gender || 'male') + '.webp';
}
```

### Specialty Chips

```html
<!-- En specialty list -->
<mat-chip *ngFor="let specialty of specialties">
  <img 
    [src]="'/images/specialties/' + specialty.slug + '.svg'" 
    [alt]="specialty.name"
    width="24" 
    height="24">
  {{ specialty.name }}
</mat-chip>
```

## 🚀 Optimización

### Responsive Images

```html
<!-- Picture element para diferentes resoluciones -->
<picture>
  <source 
    media="(min-width: 1200px)" 
    srcset="/images/home/hero-bg-large.webp">
  <source 
    media="(min-width: 768px)" 
    srcset="/images/home/hero-bg-medium.webp">
  <img 
    src="/images/home/hero-bg-small.webp" 
    alt="Hero background">
</picture>
```

### Lazy Loading

```html
<!-- Lazy load para imágenes below the fold -->
<img 
  src="/images/doctors/doctor-1.webp" 
  alt="Doctor"
  loading="lazy">
```

### WebP con Fallback

```html
<picture>
  <source type="image/webp" srcset="/images/home/hero-bg.webp">
  <source type="image/jpeg" srcset="/images/home/hero-bg.jpg">
  <img src="/images/home/hero-bg.jpg" alt="Hero">
</picture>
```

## 📱 Meta Tags (SEO)

```typescript
// En algún service o component
this.seoService.setSeo({
  title: 'MediTigo',
  description: 'Tu directorio médico',
  ogImage: '/images/logo/og-image.png', // 1200x630px
});
```

```html
<!-- En index.html o generado dinámicamente -->
<meta property="og:image" content="https://meditigo.com/images/logo/og-image.png">
<meta name="twitter:image" content="https://meditigo.com/images/logo/twitter-card.png">
```

## 🔧 Angular Configuration

Las imágenes en `public/` se copian automáticamente al build.
Acceso: `/images/...` (sin necesidad de configuración adicional).

```json
// angular.json ya tiene configurado:
{
  "architect": {
    "build": {
      "options": {
        "assets": [
          "public"  // ← Todo en public/ se copia
        ]
      }
    }
  }
}
```

## ⚠️ Errores Comunes

❌ **Incorrecto:**
```html
<img src="public/images/logo.svg">  <!-- No incluir 'public' -->
<img src="./images/logo.svg">       <!-- No usar rutas relativas -->
<img src="images/logo.svg">         <!-- Falta slash inicial -->
```

✅ **Correcto:**
```html
<img src="/images/logo.svg">        <!-- Con slash inicial -->
```

## 📦 Build y Deploy

- **Development**: `ng serve` sirve desde `/images/...`
- **Production**: `ng build` copia a `dist/browser/images/...`
- **Deploy**: Asegúrate que el servidor web sirva correctamente `/images/`

## 🎯 Checklist

- [ ] Hero background: 1920x1080px, WebP, <200KB
- [ ] Doctor placeholders: 400x400px y 600x720px
- [ ] Specialty icons: SVG o PNG 128x128px
- [ ] Logo SVG + variantes (white, dark)
- [ ] Favicon 512x512px → convertir a .ico
- [ ] OG image 1200x630px para social media
