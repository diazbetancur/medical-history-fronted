# ProDirectory Design System

Sistema de diseño escalable, moderno y accesible para ProDirectory PWA.

**Versión**: 2.0  
**Última actualización**: Enero 2026  
**Compatibilidad**: Angular 19+, Angular Material, SSR, PWA

---

## 📁 Estructura de Archivos

```
src/
├── styles/
│   ├── _design-tokens.scss    # Tokens de color, spacing, mixins
│   ├── _material-theme.scss   # Tema personalizado de Angular Material
│   └── _utilities.scss        # Clases utilitarias (Tailwind-style)
└── styles.scss                # Archivo principal (imports)
```

---

## 🎨 Paleta de Colores de Marca

| Token       | Valor     | Ratio | Uso                                      |
| ----------- | --------- | ----- | ---------------------------------------- |
| **Primary** | `#2563EB` | 4.6:1 | Acciones principales, CTAs, enlaces      |
| **Accent**  | `#FF6B35` | 3.9:1 | Destacados, elementos secundarios\*      |
| **Success** | `#10B981` | 4.5:1 | Éxito, verificaciones, estados positivos |
| **Warning** | `#F59E0B` | 3.2:1 | Alertas, pendientes\*                    |
| **Error**   | `#DC2626` | 5.9:1 | Errores, acciones destructivas           |
| **Info**    | `#0EA5E9` | 4.0:1 | Información, enlaces secundarios         |

> \*Accent y Warning solo deben usarse para texto grande (≥18px bold o ≥24px) o elementos gráficos.

### Escala de Neutrales

| Token           | Valor     | Uso                      |
| --------------- | --------- | ------------------------ |
| **White**       | `#FFFFFF` | Fondos, superficies      |
| **Neutral-50**  | `#F8FAFC` | Fondo alternativo (body) |
| **Neutral-100** | `#F1F5F9` | Hover en superficies     |
| **Neutral-200** | `#E2E8F0` | Bordes por defecto       |
| **Neutral-300** | `#CBD5E1` | Bordes secundarios       |
| **Neutral-400** | `#94A3B8` | Texto deshabilitado      |
| **Neutral-500** | `#64748B` | Texto terciario          |
| **Neutral-600** | `#475569` | Texto secundario         |
| **Neutral-800** | `#1E293B` | Texto principal          |
| **Neutral-900** | `#0F172A` | Texto enfatizado         |

---

## 🏷️ Tokens Semánticos (CSS Custom Properties)

Usar **siempre** estos tokens en lugar de colores hexadecimales:

### Texto

```scss
// ✅ Correcto
color: var(--color-text-primary); // Texto principal
color: var(--color-text-secondary); // Texto secundario
color: var(--color-text-tertiary); // Texto terciario/hint
color: var(--color-text-disabled); // Texto deshabilitado
color: var(--color-text-inverted); // Texto sobre fondos oscuros
color: var(--color-text-link); // Enlaces
color: var(--color-text-link-hover); // Enlaces hover

// ❌ Incorrecto
color: #1e293b;
color: #666;
color: rgba(0, 0, 0, 0.87);
```

### Fondos y Superficies

```scss
// ✅ Correcto
background-color: var(--color-background); // Fondo principal
background-color: var(--color-background-alt); // Fondo alternativo
background-color: var(--color-surface); // Superficie de cards
background-color: var(--color-surface-hover); // Superficie hover
background-color: var(--color-surface-pressed); // Superficie presionada
background-color: var(--color-surface-elevated); // Superficie elevada

// ❌ Incorrecto
background-color: #ffffff;
background-color: #fafafa;
```

### Estados de Status

```scss
// ✅ Correcto - Para chips y badges
background: var(--chip-success-bg);
color: var(--chip-success-text);

// ✅ Correcto - Para alertas
background: var(--alert-warning-bg);
border-color: var(--alert-warning-border);
color: var(--alert-warning-text);

// ❌ Incorrecto
background: #d1fae5;
color: #065f46;
```

### Bordes

```scss
// ✅ Correcto
border: 1px solid var(--color-border); // Borde default
border: 1px solid var(--color-border-light); // Borde sutil
border: 1px solid var(--color-border-dark); // Borde fuerte
border-color: var(--color-border-focus); // Borde focus

// ❌ Incorrecto
border: 1px solid #e2e8f0;
```

### Sombras

```scss
// ✅ Correcto
box-shadow: var(--shadow-sm); // Sombra pequeña
box-shadow: var(--shadow-md); // Sombra media (cards)
box-shadow: var(--shadow-lg); // Sombra grande (dropdowns)
box-shadow: var(--shadow-xl); // Sombra extra grande
box-shadow: var(--shadow-2xl); // Sombra máxima (modals)
box-shadow: var(--shadow-focus); // Ring de focus

// ❌ Incorrecto
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
```

### Gradientes

```scss
// ✅ Correcto
background: var(--gradient-primary); // Gradiente primary azul
background: var(--gradient-accent); // Gradiente accent naranja
background: var(--gradient-hero); // Gradiente hero (primary + accent)
background: var(--gradient-surface); // Gradiente sutil de superficie

// ❌ Incorrecto
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## 🎯 Chips de Status

Usar las variables de chip para estados consistentes:

```scss
// Pending / Warning
background: var(--chip-warning-bg);
color: var(--chip-warning-text);

// Info / Contacted
background: var(--chip-info-bg);
color: var(--chip-info-text);

// Success / Verified / Closed
background: var(--chip-success-bg);
color: var(--chip-success-text);

// Error / Rejected
background: var(--chip-error-bg);
color: var(--chip-error-text);

// Primary / Featured
background: var(--chip-primary-bg);
color: var(--chip-primary-text);

// Default / Neutral
background: var(--chip-default-bg);
color: var(--chip-default-text);
```

O usar las clases utilitarias:

```html
<span class="chip-success">Verified</span>
<span class="chip-warning">Pending</span>
<span class="chip-error">Rejected</span>
<span class="chip-info">In Progress</span>
<span class="chip-primary">Featured</span>
```

---

## 🔧 Clases Utilitarias

### Colores de Fondo

```html
<div class="bg-primary">Primary background</div>
<div class="bg-accent">Accent background</div>
<div class="bg-success-light">Success light background</div>
<div class="bg-surface">Surface background</div>
<div class="bg-gradient-hero">Hero gradient</div>
```

### Colores de Texto

```html
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-tertiary">Tertiary text</p>
<p class="text-brand-primary">Brand primary color</p>
<p class="text-success">Success text</p>
<p class="text-error">Error text</p>
```

### Bordes

```html
<div class="border-default">Default border</div>
<div class="border-primary">Primary border</div>
<div class="rounded-md">Medium rounded corners</div>
<div class="rounded-lg">Large rounded corners</div>
<div class="rounded-full">Full rounded (circle)</div>
```

### Sombras

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
```

### Alertas

```html
<div class="alert-success">Success message</div>
<div class="alert-warning">Warning message</div>
<div class="alert-error">Error message</div>
<div class="alert-info">Info message</div>
```

### Skeleton Loading

```html
<div class="skeleton" style="width: 200px; height: 20px;"></div>
<div class="skeleton-circle" style="width: 48px; height: 48px;"></div>
<div class="skeleton-card" style="width: 100%; height: 150px;"></div>
```

### Animaciones

```html
<div class="animate-fade-in">Fade in animation</div>
<div class="animate-slide-up">Slide up animation</div>
<div class="animate-pulse">Pulse animation</div>
<div class="animate-spin">Spinning animation</div>
```

---

## 📊 Tabla de Contraste (WCAG)

### Texto sobre fondos claros (Background White/Neutral-50)

| Token                    | Ratio  | WCAG AA  | WCAG AAA | Uso Recomendado     |
| ------------------------ | ------ | -------- | -------- | ------------------- |
| `--color-text-primary`   | 12.6:1 | ✅ Pass  | ✅ Pass  | Texto principal     |
| `--color-text-secondary` | 7.0:1  | ✅ Pass  | ✅ Pass  | Texto secundario    |
| `--color-text-tertiary`  | 5.3:1  | ✅ Pass  | ❌ Fail  | Hints, placeholders |
| `--color-primary`        | 4.6:1  | ✅ Pass  | ❌ Fail  | Enlaces, botones    |
| `--color-accent`         | 3.9:1  | ⚠️ Large | ❌ Fail  | Solo texto grande   |
| `--color-error`          | 5.9:1  | ✅ Pass  | ❌ Fail  | Errores             |
| `--color-success`        | 4.5:1  | ✅ Pass  | ❌ Fail  | Éxito               |
| `--color-warning`        | 3.2:1  | ⚠️ Large | ❌ Fail  | Solo texto grande   |
| `--color-info`           | 4.0:1  | ⚠️ Large | ❌ Fail  | Info, con cuidado   |

### Texto sobre color Primary (#2563EB)

| Token                | Ratio | WCAG AA | WCAG AAA |
| -------------------- | ----- | ------- | -------- |
| White                | 4.6:1 | ✅ Pass | ❌ Fail  |
| `--color-neutral-50` | 4.5:1 | ✅ Pass | ❌ Fail  |

### Reglas de Accesibilidad

1. **Texto pequeño (< 18px)**: Requiere ratio mínimo de **4.5:1** para WCAG AA
2. **Texto grande (≥ 18px bold o ≥ 24px)**: Requiere ratio mínimo de **3:1**
3. **El color Accent (#FF6B35)** solo debe usarse para:
   - Texto grande (títulos, botones grandes)
   - Elementos gráficos no esenciales
   - Iconos decorativos
4. **Siempre** usar `:focus-visible` para estados de focus accesibles
5. **Nunca** usar solo color para transmitir información (agregar iconos/texto)

---

## 🎭 Estados Interactivos

### Mixins Disponibles

```scss
// En componentes, usar:
@use "styles/design-tokens" as tokens;

// Focus ring accesible
.my-button {
  @include tokens.focus-visible-ring;
}

// Estados interactivos de botón
.custom-button {
  @include tokens.button-variant("primary"); // primary, secondary, ghost, accent, danger
}

// Estilos de card base
.my-card {
  @include tokens.card-base;
}

// Card interactiva (clickable)
.my-clickable-card {
  @include tokens.card-interactive;
}

// Chips de status
.my-status {
  @include tokens.status-chip(success); // success, warning, error, info, primary, default
}

// Input base
.my-input {
  @include tokens.input-base;
}

// Alert
.my-alert {
  @include tokens.alert(warning); // success, warning, error, info
}

// Tabla
.my-table {
  @include tokens.table-base;
}
```

### Funciones Disponibles

```scss
// Obtener color semántico
color: tokens.color("text-primary");

// Obtener sombra
box-shadow: tokens.shadow("md");

// Obtener spacing
padding: tokens.spacing("4");

// Obtener radius
border-radius: tokens.radius("lg");
```

### Breakpoints

```scss
// Mobile first
@include tokens.breakpoint-up("md") {
  // Estilos para tablet y más grande
}

@include tokens.breakpoint-down("sm") {
  // Estilos solo para móvil
}

@include tokens.mobile-only {
  // Solo móvil
}

@include tokens.tablet-up {
  // Tablet y más grande
}

@include tokens.desktop-up {
  // Desktop y más grande
}
```

---

## 🌙 Dark Mode (Preparado)

El sistema está preparado para Dark Mode pero no está activo. Para activarlo:

### Opción 1: Clase manual

1. Descomentar el bloque `.theme-dark` en `_design-tokens.scss`
2. Descomentar el bloque `.theme-dark` en `_material-theme.scss`
3. Agregar la clase `theme-dark` al elemento `<html>` o `<body>`

```typescript
// Ejemplo de toggle en servicio
@Injectable({ providedIn: "root" })
export class ThemeService {
  private isDark = signal(false);

  readonly isDarkMode = this.isDark.asReadonly();

  toggleTheme() {
    this.isDark.update((v) => !v);
    document.documentElement.classList.toggle("theme-dark", this.isDark());
    // Persistir preferencia
    localStorage.setItem("theme", this.isDark() ? "dark" : "light");
  }

  initTheme() {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    this.isDark.set(isDark);
    document.documentElement.classList.toggle("theme-dark", isDark);
  }
}
```

### Opción 2: Media query automático

Descomentar el bloque `@media (prefers-color-scheme: dark)` en `_design-tokens.scss`.

---

## ⚠️ Ejemplos Correctos vs Incorrectos

### ❌ Incorrecto

```scss
.my-component {
  background: #667eea;
  color: #666;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.error-message {
  background: #ffebee;
  color: #c62828;
}
```

### ✅ Correcto

```scss
.my-component {
  background: var(--color-primary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.error-message {
  background: var(--color-error-bg);
  color: var(--color-error-text);
}
```

### ❌ Incorrecto - Estados interactivos

```scss
.my-button {
  background: blue;

  &:hover {
    background: darkblue;
  }
}
```

### ✅ Correcto - Estados interactivos

```scss
.my-button {
  @include tokens.button-variant("primary");
  // O manualmente:
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);

  &:hover:not(:disabled) {
    background: var(--btn-primary-bg-hover);
  }

  &:active:not(:disabled) {
    background: var(--btn-primary-bg-active);
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus-outline);
    outline-offset: 2px;
  }
}
```

---

## 🚀 Checklist de Validación Visual

Antes de hacer merge, verificar:

### Colores

- [ ] No hay colores hexadecimales hardcodeados en archivos SCSS
- [ ] Todos los componentes usan tokens semánticos
- [ ] Los chips de status usan las clases/variables correctas
- [ ] Los gradientes usan `--gradient-*` variables
- [ ] Las sombras usan `--shadow-*` variables
- [ ] Los bordes usan `--color-border*` variables

### Accesibilidad

- [ ] Los estados de focus son visibles (`:focus-visible`)
- [ ] Los contrastes de texto cumplen WCAG AA (4.5:1 mínimo)
- [ ] No se usa solo color para transmitir información
- [ ] Los elementos interactivos tienen área de toque ≥44px
- [ ] Se respeta `prefers-reduced-motion`

### PWA

- [ ] PWA manifest tiene colores actualizados
- [ ] Meta theme-color está actualizado
- [ ] Apple touch icons tienen colores correctos

### Responsive

- [ ] Funciona correctamente en móvil (320px+)
- [ ] Funciona correctamente en tablet (768px+)
- [ ] Funciona correctamente en desktop (1024px+)

---

## 📝 Notas para Desarrolladores

1. **Importar tokens en componentes** (si necesitas SCSS variables/mixins):

   ```scss
   @use "styles/design-tokens" as tokens;
   ```

2. **Preferir CSS Custom Properties** sobre SCSS variables cuando sea posible (mejor rendimiento, permiten theming dinámico)

3. **No usar `!important`** excepto en clases utilitarias

4. **Mantener especificidad baja** en estilos de componentes

5. **Documentar colores nuevos** que se agreguen al sistema

6. **Usar clases utilitarias** para estilos comunes en vez de escribir CSS

7. **Probar en modo oscuro** aunque no esté activo (verificar estructura)

---

## 📦 Tokens de Componentes Disponibles

### Cards

```scss
--card-background
--card-background-hover
--card-border
--card-border-hover
--card-shadow
--card-shadow-hover
--card-radius
```

### Inputs

```scss
--input-background
--input-background-disabled
--input-border
--input-border-hover
--input-border-focus
--input-border-error
--input-placeholder
--input-text
--input-radius
```

### Buttons

```scss
--btn-radius
--btn-transition
--btn-primary-*
--btn-secondary-*
--btn-accent-*
--btn-ghost-*
--btn-danger-*
```

### Navigation

```scss
--nav-background
--nav-background-scrolled
--nav-border
--nav-text
--nav-text-hover
--nav-text-active
--nav-indicator
--nav-height
--nav-height-mobile
```

### Tables

```scss
--table-header-bg
--table-header-text
--table-row-bg
--table-row-bg-hover
--table-row-bg-striped
--table-border
--table-cell-text
```

### Dialogs

```scss
--dialog-background
--dialog-border
--dialog-shadow
--dialog-radius
--dialog-backdrop
```

---

## 🔗 Referencias

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Angular Material Theming](https://material.angular.io/guide/theming)
- [Modern CSS Color Systems](https://web.dev/building-a-color-scheme/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
