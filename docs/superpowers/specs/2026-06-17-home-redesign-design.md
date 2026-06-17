# Diseño – Rediseño del Home (look & feel)

**Fecha:** 2026-06-17
**Fuente:** "Documento sin título.docx" (cambios look & feel Plataforma Médica)
**Repo:** `medical-history-fronted` · **Rama:** `feature/home-redesign` (desde `develop`)
**Alcance:** Solo el home público (`features/public/pages/home/`). No toca backend.

## 1. Objetivo

Renovar el look & feel del home público según el documento: reemplazar el hero estático por un **slider de 3 slides** animado, animar la sección de **estadísticas** con *swipe-up* al hacer scroll, y pulir la sección **"¿Por qué elegirnos?"** (título + animación). El resto de secciones (especialidades, médicos destacados, CTA) se conservan, con animación sutil opcional al scroll.

La dirección visual del slider fue **aprobada por el solicitante** mediante prototipo (compañero visual): menú flotante redondeado, imagen grande en tarjeta, fondo de ADN animado, íconos de salud orbitando la imagen, flechas + indicadores, botones por slide.

## 2. Alcance (sí / no)

**Sí (lo del documento):**
- A) Hero → **slider de 3 slides**.
- B) Sección de **stats** con animación *swipe-up* secuencial al scroll.
- C) Sección **"¿Por qué elegirnos?"**: corregir título + *swipe-up* sutil por ítem.

**No (fuera de este alcance):**
- Rediseño de especialidades, médicos destacados y CTA (se conservan; se les puede añadir un `fade-up` sutil al scroll por consistencia, sin cambiar estructura).
- Cambios de backend, datos o endpoints (el home ya consume `public-home.service`).

## 3. Stack / dependencias (decidido: usar librería)

- **Swiper** (https://swiperjs.com) para el slider: maneja slides, autoplay, transición *fade*, flechas (navigation), indicadores (pagination), touch/swipe y accesibilidad. Se usa como Web Component (`swiper-container`/`swiper-slide`) con `CUSTOM_ELEMENTS_SCHEMA`, o el paquete `swiper/element`.
- **AOS** (animate-on-scroll) para los *swipe-up* de las secciones B y C (`data-aos="fade-up"`, `data-aos-delay` escalonado). Init en el componente con `AOS.init({ once: true, duration: 600 })`.
- **Fondo de ADN** y **órbita de íconos de salud**: CSS/SVG animado propio (sin dependencia extra).

Ambas dependencias se agregan a `package.json`. Alternativa descartada: slider propio (más código, menos robusto).

## 4. Assets

Carpeta: `src/assets/home/`. Imágenes PNG con **fondo transparente** (las entrega el solicitante después):
- `slide-1.png` — paciente + doctor (saludo)
- `slide-2.png` — asistente frente a la computadora
- `slide-3.png` — expediente médico

**Provisional:** mientras llegan los PNG transparentes, se usan las fotos actuales con fondo (`s1/s2/s3`) en tarjeta redondeada. Al integrar los PNG transparentes, la imagen se muestra **recortada/flotante** con el ADN e íconos por detrás (mismo layout). El cambio será solo de archivos + un ajuste de estilo de la imagen (quitar la tarjeta/sombra para el recorte).

## 5. Sección A — Slider principal

Un componente nuevo `HomeSliderComponent` (standalone) dentro de `features/public/pages/home/` (o `.../home/components/home-slider/`). Contenido:

- **3 slides**, cada uno con su color de fondo:
  - Slide 1: fondo celeste `#f2faff`. Título: *"Conectamos pacientes y profesionales de la salud"*. Subtítulo: *"Encuentra especialistas, agenda citas y gestiona tu atención médica desde una sola plataforma."* Imagen: `slide-1`.
  - Slide 2: fondo azul oscuro `#041c33` (texto claro). Título: *"Citas médicas más simples y organizadas"*. Subtítulo: *"Agenda, confirma y administra consultas de forma rápida, segura y en tiempo real."* Imagen: `slide-2`.
  - Slide 3: fondo celeste `#f2faff`. Título: *"Nunca vuelvas a perder tu historial médico"*. Subtítulo: *"Centraliza toda tu información de salud y la de tu familia en un expediente digital seguro y accesible para futuras consultas."* Imagen: `slide-3`.
- **Layout por slide:** texto a la izquierda (eyebrow + título + subtítulo + botones), imagen grande a la derecha (≈540×400 en desktop) con halo e **íconos de salud orbitando** (animación continua). Responsive: en móvil se apila centrado y se ocultan los íconos orbitando.
- **Menú flotante redondeado** sobre el slider (A.1): barra blanca, no abarca todo el ancho (~88%), esquinas redondeadas, sombra. Contiene marca + enlaces + botones **Iniciar sesión** / **Crear cuenta**.
  - Implementación: restyle del `public-header` existente con una **variante "flotante"** para el home (un `@Input()` o clase aplicada solo en esta ruta), para reutilizar la navegación real sin duplicar lógica. Si la variante resulta invasiva, alternativa: nav propia del slider con enlaces a las mismas rutas y ocultar el header por defecto solo en el home.
- **Botones por slide** (A.5): "Iniciar sesión" y "Crear cuenta" en cada slide, enlazando a `/login` y `/register` (verificar rutas reales; hoy hay `/login`). Decisión aprobada: aparecen en cada slide.
- **Flechas laterales** (A.6) y **indicadores inferiores** ●○○ (A.7) vía Swiper navigation + pagination.
- **Fondo de ADN** (A.8): íconos de ADN semitransparentes animados (bob/float) detrás del contenido.
- **Imagen animada** (A.2): entrada *fade-in / swipe* al cambiar de slide; **no estática**. Autoplay del slider (~5s) con pausa al hover.
- Referencia visual aprobada: prototipo del compañero visual (slider v3).

## 6. Sección B — Stats (swipe-up secuencial)

La sección de stats actual (Médicos Registrados / Pacientes Atendidos / Citas Completadas) se mantiene en estructura/datos (`stats()` de `public-home.service`). Se le agrega:
- `data-aos="fade-up"` a cada tarjeta con `data-aos-delay` escalonado (0, 120, 240 ms) para que aparezcan **una por una** al hacer scroll (B.2).
- `AOS` con `once: true` (anima una sola vez).

## 7. Sección C — "¿Por qué elegirnos?"

- Corregir el título a **"¿Por qué elegirnos?"** (casing correcto; hoy dice "¿Por Qué Elegirnos?").
- Cada ítem (`feature-item`) entra con `data-aos="fade-up"` escalonado (C.2).

## 8. Estructura de archivos (frontend)

- Modify: `src/app/features/public/pages/home/home.page.ts` — importar Swiper element + AOS init (ngAfterViewInit), `CUSTOM_ELEMENTS_SCHEMA` si se usan web components.
- Modify: `home.page.html` — reemplazar `<section class="hero">` (hero + stats-overlay) por `<app-home-slider>` + la sección de stats con `data-aos`; corregir título de features + `data-aos`.
- Modify: `home.page.scss` — estilos de stats/features que falten; el slider trae su propio scss.
- Create: `.../home/components/home-slider/home-slider.component.{ts,html,scss}` — el slider (Swiper + ADN + órbita).
- Modify: `src/main.ts` o `app.config.ts` — registrar Swiper element (`register()` de `swiper/element/bundle`) e `AOS` (CSS import en `styles` de `angular.json` o en el componente).
- Modify: `package.json` / `angular.json` — dependencias `swiper` y `aos` (+ tipos `@types/aos`), import del CSS de AOS y, si aplica, de Swiper.
- (Posible) Modify: `public-header` para la variante flotante en el home.
- Create: `src/assets/home/` con las imágenes (provisional `s*.jpg`, final `slide-*.png`).

## 9. Animación / rendimiento

- AOS `once: true` para no re-animar; respetar `prefers-reduced-motion` (desactivar animaciones no esenciales).
- Imágenes con `loading="lazy"` donde aplique; las del slider con tamaño acotado para no inflar el LCP.
- El slider pausa autoplay en hover y al perder foco.

## 10. Criterios de aceptación

- El home muestra un slider de 3 slides con los textos/colores indicados, menú flotante redondeado, flechas, indicadores, fondo de ADN animado e imagen animada por slide.
- Al hacer scroll, las 3 tarjetas de stats aparecen una por una con *swipe-up*; los ítems de "¿Por qué elegirnos?" también; el título queda corregido.
- Especialidades, médicos destacados y CTA siguen funcionando igual.
- Build de producción limpio; sin romper rutas/navegación existentes.

## 11. Notas / pendientes

- Imágenes finales (PNG transparente) las entrega el solicitante; hasta entonces se usan las fotos con fondo en tarjeta.
- Verificar nombres de rutas reales para los botones ("Crear cuenta" → `/register` o equivalente).
- La variante flotante del `public-header` es la opción preferida; si resulta invasiva, usar nav propia del slider (decisión a confirmar en el plan).
