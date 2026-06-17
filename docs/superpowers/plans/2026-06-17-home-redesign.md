# Rediseño del Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans. Pasos con checkbox (`- [ ]`).

**Goal:** Reemplazar el hero estático del home público por un slider de 3 slides (Swiper) con menú flotante, fondo de ADN animado e íconos de salud orbitando; animar las stats y "¿Por qué elegirnos?" con swipe-up al scroll (AOS).

**Architecture:** Frontend Angular 19 standalone. Nuevo `HomeSliderComponent` con Swiper (web component `swiper/element`, `register()` en main.ts + `CUSTOM_ELEMENTS_SCHEMA`). AOS para animaciones al scroll. El `public-header` gana una variante "flotante" para el home. Imágenes provisionales con fondo (s1/s2/s3) hasta recibir los PNG transparentes.

**Tech Stack:** Angular 19, Angular Material, Swiper 11 (`swiper/element`), AOS, SCSS.

**Spec:** `docs/superpowers/specs/2026-06-17-home-redesign-design.md`. **Repo/rama:** `medical-history-fronted` / `feature/home-redesign`.

**Verificación:** este feature es visual; "tests" = build limpio + revisión en la app corriendo (`npx ng serve`). Comando build: `npx ng build --configuration development`.

**Nota auth:** los botones "Iniciar sesión" / "Crear cuenta" NO navegan a rutas; abren el modal de auth. El home ya tiene `openAuthModal()`. El slider emitirá outputs que el home conecta a `openAuthModal()`.

---

## File Structure
- Modify: `package.json` (deps `swiper`, `aos`, `@types/aos`).
- Modify: `src/main.ts` (registrar Swiper element).
- Modify: `src/styles.scss` (import CSS de AOS).
- Modify: `src/app/app.config.ts` — no cambia (animations ya está); AOS se inicializa en el componente.
- Create: `src/assets/home/slide-1.jpg`, `slide-2.jpg`, `slide-3.jpg` (provisional, desde s1/s2/s3).
- Create: `src/app/features/public/pages/home/components/home-slider/home-slider.component.{ts,html,scss}` (+ `.spec.ts`).
- Modify: `src/app/features/public/components/public-header/public-header.component.{ts,scss}` (input `floating`).
- Modify: `src/app/features/public/pages/home/home.page.{ts,html,scss}` (rewire hero→slider, stats AOS, features título+AOS).

---

### Task 1: Dependencias + bootstrap de Swiper/AOS

**Files:** `package.json`, `src/main.ts`, `src/styles.scss`

- [ ] **Step 1: Instalar dependencias**

Run (en `medical-history-fronted`):
```bash
npm install swiper aos
npm install -D @types/aos
```
Expected: se agregan a `package.json` sin errores.

- [ ] **Step 2: Registrar Swiper element en `src/main.ts`**

Dejar el archivo así (agregar el import + register ANTES de bootstrap):
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { register as registerSwiper } from 'swiper/element/bundle';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

registerSwiper();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

- [ ] **Step 3: Importar el CSS de AOS en `src/styles.scss`**

Agregar al inicio de `src/styles.scss`:
```scss
@import 'aos/dist/aos.css';
```

- [ ] **Step 4: Build**

Run: `npx ng build --configuration development`
Expected: "Application bundle generation complete", sin errores.

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json src/main.ts src/styles.scss
git commit -m "build(home): agregar Swiper y AOS + registro/estilos"
```

---

### Task 2: Imágenes provisionales en assets

**Files:** Create `src/assets/home/slide-1.jpg`, `slide-2.jpg`, `slide-3.jpg`

- [ ] **Step 1: Crear carpeta y copiar las fotos actuales (con fondo, provisionales)**

Run (desde la raíz del workspace `d:/Proyects/AppLand/Proyects/Medical-app`):
```bash
mkdir -p medical-history-fronted/src/assets/home
cp s1.jpg medical-history-fronted/src/assets/home/slide-1.jpg
cp s2.jpg medical-history-fronted/src/assets/home/slide-2.jpg
cp s3.jpg medical-history-fronted/src/assets/home/slide-3.jpg
```
Expected: 3 archivos creados. (Cuando lleguen los PNG transparentes, se reemplazan por `slide-1.png` etc. y se ajusta el estilo de `.slide-img` en Task 4 — quitar tarjeta/sombra.)

- [ ] **Step 2: Commit**
```bash
cd medical-history-fronted
git add src/assets/home/
git commit -m "assets(home): imágenes provisionales del slider (s1/s2/s3)"
```

---

### Task 3: Variante "flotante" del public-header

**Files:** `src/app/features/public/components/public-header/public-header.component.ts` + `.scss`

- [ ] **Step 1: Agregar input `floating`** al componente. En `public-header.component.ts`, dentro de la clase, agregar:
```typescript
import { Input } from '@angular/core';
// ...dentro de la clase PublicHeaderComponent:
@Input() floating = false;
```
Y en el template raíz del header (`public-header.component.html`), aplicar la clase condicional en el elemento contenedor más externo (p.ej. el `<mat-toolbar>` o el wrapper). Si el contenedor raíz es `<header>` o `<mat-toolbar class="public-header">`, dejarlo:
```html
<mat-toolbar class="public-header" [class.public-header--floating]="floating">
```
(Adaptar al nombre real del contenedor raíz; agregar `[class.public-header--floating]="floating"`.)

- [ ] **Step 2: Estilos de la variante** en `public-header.component.scss` (al final):
```scss
.public-header--floating {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(92%, 1180px);
  border-radius: 32px;
  box-shadow: 0 12px 30px rgba(4, 28, 51, 0.18);
  background: #fff;
  z-index: 20;
}
@media (max-width: 768px) {
  .public-header--floating { top: 8px; width: 96%; border-radius: 24px; }
}
```

- [ ] **Step 3: Build** → `npx ng build --configuration development` → sin errores (el header sigue funcionando igual cuando `floating` es false en otras páginas).

- [ ] **Step 4: Commit**
```bash
git add src/app/features/public/components/public-header/
git commit -m "feat(public-header): variante flotante (input floating) para el home"
```

---

### Task 4: HomeSliderComponent (Swiper + ADN + órbita)

**Files:** Create `src/app/features/public/pages/home/components/home-slider/home-slider.component.ts` (+ `.html`, `.scss`, `.spec.ts`)

- [ ] **Step 1: Componente TS**
```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Output } from '@angular/core';

interface HomeSlide {
  bg1: string; bg2: string; dark: boolean; title: string; sub: string; img: string;
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
    { bg1: '#eaf6ff', bg2: '#f2faff', dark: false,
      title: 'Conectamos pacientes y profesionales de la salud',
      sub: 'Encuentra especialistas, agenda citas y gestiona tu atención médica desde una sola plataforma.',
      img: 'assets/home/slide-1.jpg' },
    { bg1: '#062845', bg2: '#041c33', dark: true,
      title: 'Citas médicas más simples y organizadas',
      sub: 'Agenda, confirma y administra consultas de forma rápida, segura y en tiempo real.',
      img: 'assets/home/slide-2.jpg' },
    { bg1: '#eaf6ff', bg2: '#f2faff', dark: false,
      title: 'Nunca vuelvas a perder tu historial médico',
      sub: 'Centraliza toda tu información de salud y la de tu familia en un expediente digital seguro y accesible para futuras consultas.',
      img: 'assets/home/slide-3.jpg' },
  ];
}
```

- [ ] **Step 2: Template HTML** (`home-slider.component.html`)
```html
<swiper-container
  class="home-swiper"
  navigation="true"
  pagination="true"
  pagination-clickable="true"
  autoplay-delay="5000"
  autoplay-pause-on-mouse-enter="true"
  effect="fade"
  loop="true"
>
  @for (s of slides; track s.title) {
    <swiper-slide>
      <div class="slide" [class.slide--dark]="s.dark"
           [style.background]="'linear-gradient(135deg,' + s.bg1 + ',' + s.bg2 + ')'">
        <div class="dna" aria-hidden="true">
          @for (n of [0,1,2,3,4,5,6,7,8,9]; track n) {
            <span [style.left.%]="(n*11+4)%96" [style.top.%]="(n*23+6)%82"
                  [style.animation-delay.s]="n*0.55">🧬</span>
          }
        </div>
        <div class="slide-inner">
          <div class="slide-text">
            <span class="eyebrow">Plataforma médica</span>
            <h1>{{ s.title }}</h1>
            <p>{{ s.sub }}</p>
            <div class="slide-btns">
              <button type="button" class="btn btn--primary" (click)="login.emit()">Iniciar sesión</button>
              <button type="button" class="btn btn--outline" (click)="register.emit()">Crear cuenta</button>
            </div>
          </div>
          <div class="slide-media">
            <div class="orbit" aria-hidden="true">
              @for (ic of healthIcons; track ic; let i = $index) {
                <span [style.--a]="(i*45) + 'deg'">{{ ic }}</span>
              }
            </div>
            <div class="halo" aria-hidden="true"></div>
            <img class="slide-img" [src]="s.img" [alt]="s.title" loading="eager" />
          </div>
        </div>
      </div>
    </swiper-slide>
  }
</swiper-container>
```

- [ ] **Step 3: Estilos SCSS** (`home-slider.component.scss`)
```scss
:host { display: block; }
.home-swiper {
  display: block; width: 100%; height: 540px;
  --swiper-navigation-color: #072036;
  --swiper-pagination-color: #0a6ebd;
  --swiper-navigation-size: 26px;
}
.slide { position: relative; width: 100%; height: 100%; color: #072036; overflow: hidden; }
.slide--dark { color: #eaf3fb; }

.dna { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.dna span { position: absolute; font-size: 48px; opacity: .10; animation: dnaBob 6.5s ease-in-out infinite; color: #0a6ebd; }
.slide--dark .dna span { color: #1f6aa0; }
@keyframes dnaBob { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-18px) rotate(8deg); } }

.slide-inner { position: absolute; inset: 0; display: flex; align-items: center; gap: 28px; padding: 104px 56px 64px; }
.slide-text { flex: 1; min-width: 0; }
.eyebrow { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: .04em; padding: 5px 12px; border-radius: 20px; margin-bottom: 14px; background: rgba(10,110,189,.10); color: #0a6ebd; }
.slide--dark .eyebrow { background: rgba(255,255,255,.12); color: #bfe0ff; }
.slide-text h1 { font-size: 31px; line-height: 1.14; margin: 0 0 14px; font-weight: 800; max-width: 540px; }
.slide-text p { font-size: 16px; line-height: 1.5; margin: 0 0 24px; max-width: 460px; opacity: .9; }
.slide-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.btn { border-radius: 26px; padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer; border: 0; }
.btn--primary { background: #0a6ebd; color: #fff; box-shadow: 0 8px 20px rgba(10,110,189,.35); }
.btn--outline { background: transparent; border: 1.5px solid #072036; color: #072036; }
.slide--dark .btn--outline { border-color: #cfe6fb; color: #eaf3fb; }

.slide-media { flex: 1.15; position: relative; display: flex; align-items: center; justify-content: center; min-width: 0; }
.slide-img { width: 100%; max-width: 540px; height: 400px; object-fit: cover; border-radius: 22px; box-shadow: 0 18px 44px rgba(0,0,0,.28); position: relative; z-index: 2; animation: slideImgIn .9s ease both; }
@keyframes slideImgIn { from { opacity: 0; transform: translateX(46px) scale(.95); } to { opacity: 1; transform: none; } }
.halo { position: absolute; width: 460px; height: 460px; border-radius: 50%; background: radial-gradient(circle, rgba(10,110,189,.16), transparent 70%); z-index: 1; }
.orbit { position: absolute; width: 540px; height: 540px; z-index: 0; }
.orbit span { position: absolute; left: 50%; top: 50%; font-size: 26px; opacity: .55; animation: orbit 20s linear infinite;
  transform: rotate(var(--a)) translateX(255px) rotate(calc(-1 * var(--a))); }
@keyframes orbit { from { transform: rotate(var(--a)) translateX(255px) rotate(calc(-1 * var(--a))); }
  to { transform: rotate(calc(var(--a) + 360deg)) translateX(255px) rotate(calc(-1 * var(--a) - 360deg)); } }

@media (max-width: 780px) {
  .home-swiper { height: auto; min-height: 600px; }
  .slide-inner { flex-direction: column; text-align: center; padding: 96px 22px 70px; }
  .slide-img { height: 240px; }
  .slide-text h1 { font-size: 23px; }
  .orbit { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dna span, .orbit span, .slide-img { animation: none !important; }
}
```

- [ ] **Step 4: Smoke test** (`home-slider.component.spec.ts`)
```typescript
import { TestBed } from '@angular/core/testing';
import { HomeSliderComponent } from './home-slider.component';

describe('HomeSliderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeSliderComponent] }).compileComponents();
  });

  it('crea el componente con 3 slides', () => {
    const fixture = TestBed.createComponent(HomeSliderComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
    expect(comp.slides.length).toBe(3);
  });

  it('emite login y register', () => {
    const fixture = TestBed.createComponent(HomeSliderComponent);
    const comp = fixture.componentInstance;
    let l = 0, r = 0;
    comp.login.subscribe(() => l++);
    comp.register.subscribe(() => r++);
    comp.login.emit(); comp.register.emit();
    expect(l).toBe(1); expect(r).toBe(1);
  });
});
```
Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/home-slider.component.spec.ts'`
Expected: 2 passing. (Si el runner no soporta `--include`, correr la suite completa; debe pasar.)

- [ ] **Step 5: Build** → `npx ng build --configuration development` → sin errores.

- [ ] **Step 6: Commit**
```bash
git add src/app/features/public/pages/home/components/home-slider/
git commit -m "feat(home): HomeSliderComponent (Swiper, ADN animado, íconos en órbita)"
```

---

### Task 5: Rewire del home (slider + stats AOS + features)

**Files:** `src/app/features/public/pages/home/home.page.ts` + `.html` + `.scss`

- [ ] **Step 1: home.page.ts** — importar el slider + AOS, inicializar AOS en `ngAfterViewInit`.
  - Agregar imports: `import { HomeSliderComponent } from './components/home-slider/home-slider.component';` y `import AOS from 'aos';`.
  - En el array `imports` del `@Component`, agregar `HomeSliderComponent`.
  - Implementar `AfterViewInit` (agregar a `implements` y el método):
```typescript
ngAfterViewInit(): void {
  AOS.init({ once: true, duration: 600, easing: 'ease-out', offset: 80 });
}
```
  - Los handlers de auth ya existen: el template llamará `openAuthModal()` para login y register (el modal de auth permite ambas). Si `openAuthModal()` acepta un modo, pasarlo; si no, llamarlo sin args para ambos.

- [ ] **Step 2: home.page.html** — reemplazos:
  1. Sustituir TODO el bloque `<section class="hero"> ... </section>` (hero + stats-overlay) por un wrapper hero con el header flotante + el slider, y MOVER las stats a su propia sección con AOS:
```html
<div class="home-hero">
  <app-public-header [floating]="true"></app-public-header>
  <app-home-slider (login)="openAuthModal()" (register)="openAuthModal()"></app-home-slider>
</div>

<!-- Stats (swipe-up secuencial al scroll) -->
<section class="stats-section">
  <div class="container">
    <div class="stats-grid">
      @if (stats(); as statsData) {
        <mat-card class="stat-card" data-aos="fade-up" data-aos-delay="0">
          <div class="stat-number">{{ statsData.totalDoctors }}+</div>
          <div class="stat-label">Médicos Registrados</div>
        </mat-card>
        <mat-card class="stat-card" data-aos="fade-up" data-aos-delay="120">
          <div class="stat-number">{{ statsData.totalPatients }}+</div>
          <div class="stat-label">Pacientes Atendidos</div>
        </mat-card>
        <mat-card class="stat-card" data-aos="fade-up" data-aos-delay="240">
          <div class="stat-number">{{ statsData.totalAppointments }}+</div>
          <div class="stat-label">Citas Completadas</div>
        </mat-card>
      } @else {
        <mat-card class="stat-card"><div class="stat-number">-</div><div class="stat-label">Médicos Registrados</div></mat-card>
        <mat-card class="stat-card"><div class="stat-number">-</div><div class="stat-label">Pacientes Atendidos</div></mat-card>
        <mat-card class="stat-card"><div class="stat-number">-</div><div class="stat-label">Citas Completadas</div></mat-card>
      }
    </div>
  </div>
</section>
```
  > IMPORTANTE: la primera línea original del archivo es `<app-public-header></app-public-header>` (fuera del hero). Quitar ESA línea suelta (ahora el header va dentro de `.home-hero` con `[floating]="true"`). El resto (especialidades, médicos, CTA, `<app-public-footer>`) se conserva.
  2. **Features (C):** cambiar el título de la línea `<h2 class="section-title">¿Por Qué Elegirnos?</h2>` a `<h2 class="section-title">¿Por qué elegirnos?</h2>`, y a cada uno de los 4 `<div class="feature-item">` agregarle `data-aos="fade-up"` con `data-aos-delay` escalonado `0/120/240/360`.

- [ ] **Step 3: home.page.scss** — agregar estilos del wrapper hero + sección de stats (reemplazando los del antiguo `.hero`/`.stats-overlay` si chocan):
```scss
.home-hero {
  position: relative;
  /* el header flotante se posiciona absoluto dentro de este wrapper */
}
.stats-section {
  padding: 40px 0 8px;
  .stats-grid {
    display: grid; gap: 18px; grid-template-columns: repeat(3, 1fr);
    max-width: 1000px; margin: -60px auto 0; position: relative; z-index: 5;
  }
  .stat-card { text-align: center; padding: 22px 16px; border-radius: 16px; }
  .stat-number { font-size: 30px; font-weight: 800; color: var(--color-primary); }
  .stat-label { color: var(--color-text-secondary); font-size: 14px; }
  @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); margin-top: 16px; } }
}
```
  > Si el `.scss` ya define `.stat-card`/`.stat-number`/`.stat-label` dentro del antiguo `.hero .stats-overlay`, mover/ajustar esas reglas a `.stats-section` y eliminar las del hero viejo. El `margin-top:-60px` hace que las stats "monten" sobre el borde inferior del slider (efecto overlay sutil); ajustar si se ve mal.

- [ ] **Step 4: Build** → `npx ng build --configuration development` → sin errores. Corregir cualquier error (imports faltantes, `openAuthModal` firma) hasta build limpio.

- [ ] **Step 5: Commit**
```bash
git add src/app/features/public/pages/home/home.page.ts src/app/features/public/pages/home/home.page.html src/app/features/public/pages/home/home.page.scss
git commit -m "feat(home): hero→slider con header flotante; stats y features con swipe-up (AOS)"
```

---

### Task 6: Verificación visual en la app

**Files:** —

- [ ] **Step 1: Levantar la app**
Run: `npx ng serve` (o build dev) y abrir `http://localhost:4200/`.

- [ ] **Step 2: Verificar (observación en la app corriendo):**
  - El home muestra el **slider de 3 slides** con auto-rotación, flechas, indicadores, menú flotante redondeado, fondo de ADN animado e íconos orbitando; los textos/colores por slide coinciden con el spec.
  - Botones "Iniciar sesión" / "Crear cuenta" abren el **modal de auth**.
  - Al hacer scroll, las **3 stats** aparecen una por una (swipe-up); los ítems de **"¿Por qué elegirnos?"** también; el título dice "¿Por qué elegirnos?".
  - Especialidades, médicos destacados y CTA siguen funcionando.
  - Responsive: en móvil el slider se apila y se ocultan los íconos orbitando.
- [ ] **Step 3:** Reportar hallazgos. (Sin commit; es verificación.)

---

## Self-Review (cobertura del spec)
- A (slider) → Tasks 4 + 5 (+ deps Task 1, assets Task 2, header flotante Task 3).
- B (stats swipe-up secuencial) → Task 5 Step 2.1 (data-aos + delays) + AOS init Task 5 Step 1.
- C (título + swipe-up) → Task 5 Step 2.2.
- Stack Swiper + AOS → Task 1. Assets → Task 2. Menú flotante → Task 3.
- Pendiente conocido: imágenes finales PNG transparentes (swap de archivos + quitar tarjeta en `.slide-img`); ruta real de "Crear cuenta" no aplica (usa modal).
- Nota: el rediseño es visual → verificación por app corriendo (Task 6) + smoke test del slider (Task 4); no hay tests unitarios de las otras secciones (consistente con el código actual).
