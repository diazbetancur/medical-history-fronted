# Public Images

Estructura de imágenes públicas para MediTigo.

## Estructura

```
images/
├── home/          # Imágenes para el home page
├── doctors/       # Fotos de doctores y profesionales
├── specialties/   # Iconos y badges de especialidades médicas
└── logo/          # Logos de la aplicación
```

## Formatos Recomendados

- **Fotos/Hero**: WebP, JPEG (calidad 80-85%)
- **Logos/Iconos**: SVG, PNG con transparencia
- **Thumbnails**: WebP (mejor compresión)

## Optimización

- Usar WebP cuando sea posible para mejor compresión
- Hero images: máximo 200KB
- Thumbnails: máximo 50KB
- Logos: SVG preferido, PNG como fallback

## Acceso

Las imágenes se acceden desde la raíz:
```html
<img src="/images/home/hero-bg.jpg" alt="Hero">
```
