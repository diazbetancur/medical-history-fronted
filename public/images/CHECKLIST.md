# Image Assets Checklist

Lista de imágenes necesarias para MediTigo y dónde conseguirlas.

## 🎯 Prioridad Alta (Necesarias para MVP)

### 1. Logo Principal
- [ ] `logo.svg` - Logo principal con texto (usado en header)
- [ ] `logo-icon.svg` - Solo ícono cuadrado 512x512px
- [ ] `favicon.ico` - Generado desde logo-icon.svg

**Status**: ⚠️ Actualmente se usa texto "MediTigo" con CSS gradient  
**Herramientas**:
- Crear logo: [Canva](https://www.canva.com/), [Figma](https://www.figma.com/)
- Generar favicon: [RealFaviconGenerator](https://realfavicongenerator.net/)

### 2. Hero Background (Opcional)
- [x] `hero-medico.jpg` - Ya existe (37KB) ✅
- [ ] `hero-bg.webp` - Versión WebP optimizada (<200KB)

**Status**: ✅ Ya existe hero-medico.jpg  
**Mejora**: Convertir a WebP para mejor compresión

### 3. Doctor Placeholders
- [ ] `doctor-placeholder-male.webp` - Placeholder masculino (400x400px)
- [ ] `doctor-placeholder-female.webp` - Placeholder femenino (400x400px)
- [ ] `doctor-card-placeholder-male.webp` - Card vertical (600x720px)
- [ ] `doctor-card-placeholder-female.webp` - Card vertical (600x720px)

**Status**: ℹ️ Actualmente usa UI Avatars API (generados dinámicamente)  
**Alternativas**:
- [Generated Photos](https://generated.photos/) - Rostros generados por IA
- [This Person Does Not Exist](https://thispersondoesnotexist.com/)
- Mantener UI Avatars API (no requiere archivos)

## 📋 Prioridad Media (Mejorarán la UX)

### 4. Specialty Icons
- [ ] `cardiology.svg` - Cardiología
- [ ] `dermatology.svg` - Dermatología
- [ ] `general-medicine.svg` - Medicina General
- [ ] `gynecology.svg` - Ginecología
- [ ] `neurology.svg` - Neurología
- [ ] `orthopedics.svg` - Ortopedia
- [ ] `pediatrics.svg` - Pediatría
- [ ] `psychiatry.svg` - Psiquiatría

**Status**: ℹ️ Actualmente se pueden usar Material Icons  
**Fuentes**:
- [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols)
- [Flaticon Medical](https://www.flaticon.com/free-icons/medical)
- [Noun Project](https://thenounproject.com/)

### 5. Social Media / OG Images
- [ ] `og-image.png` - Open Graph 1200x630px
- [ ] `twitter-card.png` - Twitter Card 1200x600px

**Status**: ⚠️ Pendiente  
**Uso**: Cuando se comparte en redes sociales (WhatsApp, Facebook, Twitter)  
**Herramientas**:
- [Bannerbear OG Generator](https://www.bannerbear.com/demos/automated-social-media-og-images/)
- [Canva Social Media Templates](https://www.canva.com/templates/social-media/)

## 🎨 Prioridad Baja (Nice to Have)

### 6. Feature Section Illustrations
- [ ] `feature-verified.svg` - Ilustración verificación
- [ ] `feature-schedule.svg` - Ilustración agenda
- [ ] `feature-quality.svg` - Ilustración calidad
- [ ] `feature-support.svg` - Ilustración soporte

**Status**: ℹ️ Actualmente usa iconos Material (suficiente)  
**Fuentes**:
- [unDraw](https://undraw.co/illustrations) - Ilustraciones SVG gratis
- [Storyset](https://storyset.com/) - Ilustraciones animadas

### 7. About Page / Team Photos
- [ ] Fotos del equipo si es necesario
- [ ] Fotos de oficina/clínica si aplica

## 🔧 Herramientas de Optimización

### Convertir a WebP
```bash
# Instalar cwebp (Windows)
# Descargar de: https://developers.google.com/speed/webp/download

# Convertir JPG/PNG a WebP
cwebp -q 85 input.jpg -o output.webp

# Batch conversion
Get-ChildItem *.jpg | ForEach-Object { cwebp -q 85 $_.Name -o ($_.BaseName + '.webp') }
```

### Optimizar Imágenes Existentes
```bash
# Usando PowerShell con ImageMagick
magick hero-medico.jpg -resize 1920x1080^ -quality 85 hero-medico-optimized.jpg
```

**Online**:
- [Squoosh](https://squoosh.app/) - Compresor de imágenes
- [TinyPNG](https://tinypng.com/) - Compresor PNG/JPG
- [CloudConvert](https://cloudconvert.com/) - Convertidor universal

## 📊 Tamaños Recomendados

| Tipo | Dimensiones | Formato | Peso Máximo |
|------|-------------|---------|-------------|
| Hero Background | 1920x1080px | WebP/JPG | 200KB |
| Doctor Profile | 400x400px | WebP/JPG | 50KB |
| Doctor Card | 600x720px | WebP/JPG | 80KB |
| Logo | Vectorial | SVG | - |
| Logo Icon | 512x512px | SVG/PNG | 20KB |
| Specialty Icon | 128x128px | SVG/PNG | 10KB |
| OG Image | 1200x630px | PNG/JPG | 150KB |
| Favicon | 512x512px | PNG → ICO | - |

## 🌐 Fuentes Gratuitas de Imágenes

### Fotos Médicas/Doctores
- [Unsplash](https://unsplash.com/s/photos/doctor) - Alta calidad, gratis
- [Pexels](https://www.pexels.com/search/medical/) - Gratis para uso comercial
- [Pixabay](https://pixabay.com/images/search/hospital/) - Licencia libre

### Iconos Médicos
- [Material Icons](https://fonts.google.com/icons?icon.query=medical) - Gratis, Google
- [Font Awesome](https://fontawesome.com/icons?c=medical) - Algunos gratis
- [Flaticon](https://www.flaticon.com/free-icons/medical) - Gratis con atribución

### Ilustraciones
- [unDraw](https://undraw.co/) - SVG customizables gratis
- [Storyset](https://storyset.com/) - Ilustraciones animadas gratis
- [DrawKit](https://www.drawkit.io/) - Ilustraciones vectoriales

### Rostros Generados (Sin Copyright)
- [Generated Photos](https://generated.photos/) - IA generada
- [This Person Does Not Exist](https://thispersondoesnotexist.com/) - Gratis

## ✅ Quick Start

### Paso 1: Logo Básico (5 minutos)
Crear logo simple en Canva con texto "MediTigo" + gradiente #667eea → #764ba2

### Paso 2: Hero Image (5 minutos)
Descargar 1 imagen de Unsplash de doctor/hospital y optimizar a WebP

### Paso 3: Placeholders (10 minutos)
Descargar 2-3 fotos de doctores de Pexels para usar como placeholders

### Paso 4: Favicon (2 minutos)
Tomar logo icon y generar favicon en RealFaviconGenerator

**Total**: ~30 minutos para assets básicos funcionales

## 📝 Notas

- ✅ **Ya existe**: `hero-medico.jpg` (37KB) en `/public/images/home/`
- ℹ️ **UI Avatars**: Placeholders de doctores generados dinámicamente (no requiere archivos)
- ⚠️ **Logo**: Actualmente es solo texto CSS, considerar crear logo real
- 📦 **Material Icons**: Cubren la mayoría de iconos de especialidades

## 🎯 Recomendación

Para MVP rápido:
1. ✅ Mantener hero-medico.jpg existente
2. ✅ UI Avatars para fotos de doctores (ya implementado)
3. ✅ Material Icons para especialidades (ya disponible)
4. ⚠️ Crear logo SVG simple (prioridad)
5. ⚠️ Generar favicon desde logo (prioridad)

**Tiempo estimado**: 15-30 minutos para completar prioridades
