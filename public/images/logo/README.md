# MediTigo Logos

Logos y variantes de la marca MediTigo.

## Especificaciones

### Logo Principal
- **logo.svg**
  - Formato: SVG vectorial
  - Uso: Header, documentos, impresión
  - Color: Gradiente #667eea → #764ba2

### Variantes
- **logo-white.svg**
  - Logo en blanco para fondos oscuros
  - Uso: Hero sections, footers oscuros

- **logo-dark.svg**
  - Logo en negro/gris oscuro
  - Uso: Fondos claros, documentos B&N

- **logo-icon.svg**
  - Solo ícono sin texto (cuadrado)
  - Dimensiones: 512x512px
  - Uso: Favicon, app icons, redes sociales

### Favicon
- **favicon.ico**
  - Múltiples resoluciones: 16x16, 32x32, 48x48
  - Ubicación: `/public/favicon.ico`

### Social Media
- **og-image.png**
  - Dimensiones: 1200x630px
  - Uso: Open Graph (Facebook, Twitter, WhatsApp)
  - Ubicación: `/public/icons/og-image.png`

- **twitter-card.png**
  - Dimensiones: 1200x600px
  - Uso: Twitter Cards

## Nomenclatura

```
logo.svg                    # Logo principal (color)
logo-white.svg              # Logo blanco
logo-dark.svg               # Logo oscuro
logo-icon.svg               # Solo ícono
logo-horizontal.svg         # Logo horizontal (texto al lado)
logo-vertical.svg           # Logo vertical (texto abajo)
```

## Uso en Código

```html
<!-- En public-header.component.ts -->
<a routerLink="/" class="logo">
  <img src="/images/logo/logo.svg" alt="MediTigo" height="32">
</a>

<!-- Para hacer match con el CSS actual del gradiente -->
<span class="logo-text">MediTigo</span>
```

## Especificaciones de Branding

- **Colores primarios**: 
  - Púrpura: #667eea
  - Púrpura oscuro: #764ba2
  - Gradiente: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

- **Tipografía**: 
  - Font weight: 700 (Bold)
  - Sans-serif moderna

## Generadores

- Logo SVG simple: https://www.figma.com/
- Favicon generator: https://realfavicongenerator.net/
- OG Image generator: https://www.bannerbear.com/
