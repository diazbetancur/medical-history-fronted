# Refinamiento global de formularios y modales (Opción A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que todos los `mat-form-field` y diálogos se vean "soft outline" delicados (borde fino, foco con anillo translúcido, error sutil, esquinas 11/18px, tipografía moderna) cambiando solo la capa global de estilos.

**Architecture:** Solo SCSS global — `src/styles/_design-tokens.scss` (tokens de campo) y `src/styles/_material-theme.scss` (restyle del form-field outline vía variables MDC + anillo de foco; chrome de diálogo; familia tipográfica) + `src/styles.scss` (fuente base). Cero cambios de templates, componentes o lógica.

**Tech Stack:** Angular 19, Angular Material M2 (MDC), SCSS.

## Global Constraints

- Solo capa global de estilos: NO tocar templates `.html`, componentes `.ts`, ni lógica. App-wide (afecta público + privado).
- Dirección: Opción A (soft outline). Azul de marca foco = `--color-primary` (#0a6ebd). Sin webfonts externas.
- No migrar M2 → M3.
- No hay unit test para CSS de tema: el gate automático es `npx ng build --configuration development` (compila el SCSS y falla si hay error); la aceptación final es **revisión visual** de un formulario y un diálogo reales.
- Si el build falla por algo no relacionado y pre-existente (p. ej. warning `RouterLink` en SearchPageComponent), no es regresión de este cambio.

---

### Task 1: Inputs soft-outline (tokens + form-field)

**Files:**
- Modify: `src/styles/_design-tokens.scss` (agregar tokens de campo dentro de `:root`, tras la sección "Borders")
- Modify: `src/styles/_material-theme.scss` (sección "Form fields", ~L359-448)

**Interfaces:**
- Produces: tokens CSS `--field-border`, `--field-border-hover`, `--field-ring`, `--field-invalid-border`, `--field-invalid-ring` consumidos por el restyle del form-field.

- [ ] **Step 1: Agregar tokens de campo** — en `src/styles/_design-tokens.scss`, dentro de `:root`, inmediatamente DESPUÉS de la línea `--color-border-success: #{$color-brand-success};` (cierre de la sección Borders), insertar:

```scss

  // ----------------------------------------------------------------------------
  // Form fields (soft outline)
  // ----------------------------------------------------------------------------
  --field-border: #dde3ea;
  --field-border-hover: #c4ccd6;
  --field-ring: rgba(10, 110, 189, 0.12);
  --field-invalid-border: #f0a6a6;
  --field-invalid-ring: rgba(220, 38, 38, 0.12);
```

- [ ] **Step 2: Restyle del form-field a soft-outline** — en `src/styles/_material-theme.scss`, dentro del bloque `.mat-mdc-form-field { ... }`, REEMPLAZAR estos dos sub-bloques finales (el de foco y el de inválido, justo antes del `}` que cierra `.mat-mdc-form-field`):

```scss
  &.mat-focused {
    .mdc-notched-outline__leading,
    .mdc-notched-outline__notch,
    .mdc-notched-outline__trailing {
      border-color: var(--color-primary, #2563eb) !important;
      border-width: 2px;
    }
  }

  &.mat-form-field-invalid {
    .mdc-notched-outline__leading,
    .mdc-notched-outline__notch,
    .mdc-notched-outline__trailing {
      border-color: var(--color-error, #dc2626) !important;
    }
  }
}
```

por:

```scss
  // Soft-outline (delicado): borde fino en reposo, foco de marca + anillo translúcido,
  // inválido sutil. Se usan las variables MDC del outlined text-field en vez de
  // pelear con los pseudo-bordes del notched-outline.
  --mdc-outlined-text-field-container-shape: 11px;
  --mdc-outlined-text-field-outline-color: var(--field-border, #dde3ea);
  --mdc-outlined-text-field-hover-outline-color: var(--field-border-hover, #c4ccd6);
  --mdc-outlined-text-field-focus-outline-color: var(--color-primary, #0a6ebd);
  --mdc-outlined-text-field-outline-width: 1px;
  --mdc-outlined-text-field-focus-outline-width: 1.5px;
  --mdc-outlined-text-field-error-outline-color: var(--field-invalid-border, #f0a6a6);
  --mdc-outlined-text-field-error-hover-outline-color: var(--field-invalid-border, #f0a6a6);
  --mdc-outlined-text-field-error-focus-outline-color: var(--field-invalid-border, #f0a6a6);

  .mat-mdc-text-field-wrapper {
    transition: box-shadow 150ms ease-in-out;
  }

  &.mat-focused .mat-mdc-text-field-wrapper {
    box-shadow: 0 0 0 4px var(--field-ring, rgba(10, 110, 189, 0.12));
  }

  &.mat-form-field-invalid.mat-focused .mat-mdc-text-field-wrapper {
    box-shadow: 0 0 0 4px var(--field-invalid-ring, rgba(220, 38, 38, 0.12));
  }
}
```

- [ ] **Step 3: Subir el radio del wrapper a 11px** — en el mismo archivo, justo debajo del bloque anterior está:

```scss
.mat-mdc-text-field-wrapper {
  border-radius: 8px !important;
}
```

cambiar `8px` por `11px`:

```scss
.mat-mdc-text-field-wrapper {
  border-radius: 11px !important;
}
```

- [ ] **Step 4: Verificar build (compila el SCSS)**

Run: `npx ng build --configuration development`
Expected: `Application bundle generation complete`, exit 0. (Un warning pre-existente de `RouterLink` en `SearchPageComponent` es aceptable; cualquier error de SCSS no lo es.)

- [ ] **Step 5: Revisión visual (aceptación)**

Levantar la app y abrir un formulario representativo (p. ej. el diálogo "Nuevo examen" en `/patient/profile`, o el login). Confirmar: borde fino gris en reposo, esquinas redondeadas (~11px), al enfocar aparece el anillo azul translúcido (no un borde grueso), un campo inválido muestra borde rojo suave + anillo rojo translúcido al enfocar, los íconos prefix/suffix y el `textarea`/`select`/datepicker siguen alineados y funcionando. Si algún estado se ve raro, ajustar las variables/anillo y re-verificar.

- [ ] **Step 6: Commit**

```bash
git add src/styles/_design-tokens.scss src/styles/_material-theme.scss
git commit -m "style(forms): soft-outline mat-form-fields (thin border + translucent focus ring)"
```

---

### Task 2: Chrome de diálogos + tipografía moderna

**Files:**
- Modify: `src/styles/_material-theme.scss` (typography config ~L172-173; bloque `.mat-mdc-dialog-container` ~L525-532)
- Modify: `src/styles.scss` (`body` font-family ~L35)

**Interfaces:**
- Consumes: nada de Task 1 (independiente).

- [ ] **Step 1: Tipografía moderna en el theme** — en `src/styles/_material-theme.scss`, en `$pro-directory-typography: mat.m2-define-typography-config(`, cambiar la línea:

```scss
  $font-family: 'Roboto, "Helvetica Neue", sans-serif',
```

por:

```scss
  $font-family: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
```

- [ ] **Step 2: Tipografía base en styles.scss** — en `src/styles.scss`, en el selector `body {`, cambiar:

```scss
  font-family: Roboto, "Helvetica Neue", sans-serif;
```

por:

```scss
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

- [ ] **Step 3: Refinar el chrome del diálogo** — en `src/styles/_material-theme.scss`, REEMPLAZAR el bloque:

```scss
// Dialog
.mat-mdc-dialog-container {
  border-radius: 16px !important;

  .mat-mdc-dialog-title {
    color: var(--color-text-primary, #1e293b);
    font-weight: 600;
  }
}
```

por:

```scss
// Dialog
.mat-mdc-dialog-container {
  border-radius: 18px !important;

  .mat-mdc-dialog-title {
    color: var(--color-text-primary, #1e293b);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .mdc-dialog__surface {
    border-radius: 18px !important;
    box-shadow:
      0 24px 60px -12px rgba(16, 24, 40, 0.28),
      0 0 0 1px rgba(16, 24, 40, 0.04) !important;
  }
}
```

(Nota: NO se cambia el padding global del diálogo — varios diálogos manejan su propio padding/layout, ej. `auth-modal-panel` y `notif-dialog` con `padding: 0`; un cambio global de padding arriesga regresiones. Se difiere a un ajuste por-diálogo si se quiere más aire.)

- [ ] **Step 4: Verificar build**

Run: `npx ng build --configuration development`
Expected: `Application bundle generation complete`, exit 0.

- [ ] **Step 5: Revisión visual (aceptación)**

Abrir cualquier diálogo (p. ej. "Nuevo examen", confirmar cancelación, o el modal de auth): esquinas 18px, sombra grande y suave, título un punto más marcado. Confirmar que la app entera usa la tipografía del sistema (más moderna que Roboto) y que los diálogos con `padding:0` propio (auth/notificaciones) siguen viéndose bien.

- [ ] **Step 6: Commit**

```bash
git add src/styles/_material-theme.scss src/styles.scss
git commit -m "style(ui): refine dialog chrome (18px, soft shadow) + modern system font"
```

---

## Self-Review

- **Spec coverage:** inputs soft-outline (Task 1: tokens + form-field + radio) ✓ · tokens `--field-*` (Task 1 Step 1) ✓ · chrome de modales 18px + sombra + título (Task 2 Step 3) ✓ · tipografía system-ui en theme + body (Task 2 Steps 1-2) ✓ · solo capa global, sin templates/lógica ✓ · app-wide ✓. El "padding más generoso" del spec se difiere con justificación (riesgo de regresión en diálogos con padding propio) — documentado en Task 2 Step 3.
- **Placeholder scan:** sin TBD/TODO; todo el SCSS está completo. La verificación es build + visual (declarado en Global Constraints, no es un placeholder).
- **Type/nombre consistency:** los tokens `--field-border/-hover/-ring/-invalid-border/-invalid-ring` definidos en Task 1 Step 1 se usan idénticos en Step 2; `--color-primary` ya existe en el sistema; las variables MDC (`--mdc-outlined-text-field-*`) son las estándar de Angular Material M2.
