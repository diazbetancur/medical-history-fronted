# Grupo Familiar — Ayuda contextual ligera · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un usuario entienda qué es el Grupo Familiar, cómo usarlo y la diferencia entre *dependiente* e *invitación*, sin salir de la pantalla.

**Architecture:** Frontend-only. Un componente standalone colapsable reutilizable ("¿Cómo funciona?") montado arriba de la lista de grupos y de invitaciones, copy más explicativa en los estados vacíos, y tooltips puntuales en el detalle. Sin cambios de backend ni de lógica.

**Tech Stack:** Angular 19 (standalone components, signals, SSR), Angular Material (expansion panel, tooltip), Karma + Jasmine.

**Spec:** `docs/superpowers/specs/2026-06-19-grupo-familiar-ayuda-contextual-design.md`

**Branch:** `roadmap` (convención actual del proyecto pre-PDN).

---

## File Structure

- **Create:** `src/app/patient/pages/family-group/components/family-group-help-panel/family-group-help-panel.component.ts` — panel colapsable reutilizable; persiste estado (abierto/cerrado) en localStorage, SSR-safe.
- **Create:** `.../family-group-help-panel.component.html` — copy "¿Cómo funciona?".
- **Create:** `.../family-group-help-panel.component.scss` — estilos mínimos.
- **Create:** `.../family-group-help-panel.component.spec.ts` — test de la lógica de persistencia.
- **Modify:** `src/app/patient/pages/family-group/family-group-list.page.ts` + `.html` — montar panel + mejorar empty state.
- **Modify:** `src/app/patient/pages/family-group/family-requests.page.ts` + `.html` — montar panel + mejorar empty state.
- **Modify:** `src/app/patient/pages/family-group/family-group-detail.page.html` — tooltips en chips y botón (sin tocar el `.ts`; `MatTooltipModule` ya está importado).

**Nota de verificación:** el gate primario es `npx tsc --noEmit -p tsconfig.app.json` + `npx ng build --configuration development` (ambos ya usados con éxito en este repo). El único test unitario es el del panel (Task 1), por ser la única lógica real.

---

### Task 1: Componente `FamilyGroupHelpPanelComponent`

**Files:**
- Create: `src/app/patient/pages/family-group/components/family-group-help-panel/family-group-help-panel.component.ts`
- Create: `src/app/patient/pages/family-group/components/family-group-help-panel/family-group-help-panel.component.html`
- Create: `src/app/patient/pages/family-group/components/family-group-help-panel/family-group-help-panel.component.scss`
- Test: `src/app/patient/pages/family-group/components/family-group-help-panel/family-group-help-panel.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `family-group-help-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FamilyGroupHelpPanelComponent } from './family-group-help-panel.component';

describe('FamilyGroupHelpPanelComponent', () => {
  const KEY = 'fg-help-panel-expanded';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [FamilyGroupHelpPanelComponent],
      providers: [provideNoopAnimations()],
    });
  });

  function create(): FamilyGroupHelpPanelComponent {
    return TestBed.createComponent(FamilyGroupHelpPanelComponent).componentInstance;
  }

  it('defaults to collapsed when there is no stored preference', () => {
    expect(create().expanded()).toBe(false);
  });

  it('starts expanded when the stored preference is "true"', () => {
    localStorage.setItem(KEY, 'true');
    expect(create().expanded()).toBe(true);
  });

  it('persists the expanded state when it changes', () => {
    const c = create();
    c.onExpandedChange(true);
    expect(c.expanded()).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('true');
    c.onExpandedChange(false);
    expect(localStorage.getItem(KEY)).toBe('false');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/family-group-help-panel.component.spec.ts'`
Expected: FAIL — `Cannot find module './family-group-help-panel.component'` (the component does not exist yet).

- [ ] **Step 3: Create the component class**

Create `family-group-help-panel.component.ts`:

```ts
import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

const STORAGE_KEY = 'fg-help-panel-expanded';

/**
 * Panel colapsable "¿Cómo funciona?" para el módulo de Grupo Familiar.
 * Colapsado por defecto; recuerda el estado del usuario en localStorage.
 * SSR-safe: en el servidor no toca localStorage y arranca colapsado.
 */
@Component({
  selector: 'app-family-group-help-panel',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './family-group-help-panel.component.html',
  styleUrl: './family-group-help-panel.component.scss',
})
export class FamilyGroupHelpPanelComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly expanded = signal(this.readPersisted());

  onExpandedChange(open: boolean): void {
    this.expanded.set(open);
    this.persist(open);
  }

  private readPersisted(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(open: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore storage failures (modo privado, cuota)
    }
  }
}
```

- [ ] **Step 4: Create the template**

Create `family-group-help-panel.component.html`:

```html
<mat-expansion-panel
  class="fg-help"
  [expanded]="expanded()"
  (expandedChange)="onExpandedChange($event)"
>
  <mat-expansion-panel-header>
    <mat-panel-title>
      <mat-icon>help_outline</mat-icon>
      ¿Cómo funciona el grupo familiar?
    </mat-panel-title>
  </mat-expansion-panel-header>

  <div class="fg-help__body">
    <p>
      <strong>Qué es:</strong> Un grupo familiar te permite administrar la
      información médica de las personas que cuidas —tus hijos, un familiar
      mayor o tu pareja— desde tu propia cuenta.
    </p>

    <p><strong>Dos formas de sumar personas:</strong></p>
    <ul>
      <li>
        <strong>Dependiente</strong> — alguien sin cuenta propia (por ejemplo un
        hijo menor). Tú creas y gestionas todo su perfil.
      </li>
      <li>
        <strong>Miembro registrado (por invitación)</strong> — alguien que ya
        tiene cuenta. Le envías una invitación y, al aceptarla, autoriza que los
        administradores del grupo vean y gestionen su información.
      </li>
    </ul>

    <p>
      <strong>Roles:</strong> Principal (creador) · Administrador (gestiona e
      invita) · Miembro.
    </p>
  </div>
</mat-expansion-panel>
```

- [ ] **Step 5: Create the styles**

Create `family-group-help-panel.component.scss`:

```scss
.fg-help {
  display: block;
  margin-bottom: 1rem;

  mat-panel-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
  }

  &__body {
    p {
      margin: 0 0 0.75rem;
      line-height: 1.5;
    }

    ul {
      margin: 0 0 0.75rem;
      padding-left: 1.25rem;
    }

    li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx ng test --watch=false --browsers=ChromeHeadless --include='**/family-group-help-panel.component.spec.ts'`
Expected: PASS (3 specs).

> If ChromeHeadless is unavailable in the environment, fall back to the type-check gate (`npx tsc --noEmit -p tsconfig.app.json` → exit 0) and proceed; note the skipped run in the commit body.

- [ ] **Step 7: Commit**

```bash
git add src/app/patient/pages/family-group/components/family-group-help-panel/
git commit -m "feat(family-group): collapsible '¿Cómo funciona?' help panel"
```

---

### Task 2: Montar el panel + empty state en la lista de grupos

**Files:**
- Modify: `src/app/patient/pages/family-group/family-group-list.page.ts`
- Modify: `src/app/patient/pages/family-group/family-group-list.page.html`

- [ ] **Step 1: Import the panel in the page component**

In `family-group-list.page.ts`, add the import near the other local imports (after line 10, `CreateGroupDialogComponent`):

```ts
import { FamilyGroupHelpPanelComponent } from './components/family-group-help-panel/family-group-help-panel.component';
```

Then add it to the `imports` array of the `@Component` decorator (currently lines 17-22), so it reads:

```ts
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FamilyGroupHelpPanelComponent,
  ],
```

- [ ] **Step 2: Render the panel and enrich the empty state**

In `family-group-list.page.html`, insert the panel right after the `</header>` (line 7) and before the `@if (isLoading())` block:

```html
  <app-family-group-help-panel />
```

Then replace the empty-state block (currently lines 11-17, the `@else if (groups().length === 0)` card) with:

```html
  } @else if (groups().length === 0) {
    <mat-card class="fg-empty">
      <mat-icon>family_restroom</mat-icon>
      <h2>Aún no tienes grupos familiares</h2>
      <p>
        Crea uno para administrar la información médica de las personas que
        cuidas (hijos, adultos mayores o tu pareja). Podrás agregar dependientes
        sin cuenta o invitar a quienes ya tienen una.
      </p>
      <button mat-flat-button color="primary" (click)="openCreate()">Crear grupo familiar</button>
    </mat-card>
  } @else {
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/patient/pages/family-group/family-group-list.page.ts src/app/patient/pages/family-group/family-group-list.page.html
git commit -m "feat(family-group): help panel + clearer empty state on group list"
```

---

### Task 3: Montar el panel + empty state en invitaciones

**Files:**
- Modify: `src/app/patient/pages/family-group/family-requests.page.ts`
- Modify: `src/app/patient/pages/family-group/family-requests.page.html`

- [ ] **Step 1: Import the panel in the page component**

In `family-requests.page.ts`, add the import after line 10 (`FamilyJoinRequest` type import):

```ts
import { FamilyGroupHelpPanelComponent } from './components/family-group-help-panel/family-group-help-panel.component';
```

Then add it to the `imports` array (currently lines 15-21):

```ts
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FamilyGroupHelpPanelComponent,
  ],
```

- [ ] **Step 2: Render the panel and enrich the empty state**

In `family-requests.page.html`, insert the panel right after the closing `</div>` of `.page-header` (line 12) and before the `<section class="privacy-note">` (line 14):

```html
  <app-family-group-help-panel />
```

Then replace the empty-state block (currently lines 38-44, the `@else if (requests().length === 0)` card content) so the `<p>` reads:

```html
  } @else if (requests().length === 0) {
  <mat-card class="state-card">
    <mat-card-content>
      <mat-icon>mark_email_read</mat-icon>
      <p>
        No tienes invitaciones pendientes. Cuando alguien te invite a su grupo
        familiar, la verás aquí para aceptarla o rechazarla.
      </p>
    </mat-card-content>
  </mat-card>
  } @else {
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/patient/pages/family-group/family-requests.page.ts src/app/patient/pages/family-group/family-requests.page.html
git commit -m "feat(family-group): help panel + clearer empty state on invitations"
```

---

### Task 4: Tooltips puntuales en el detalle

**Files:**
- Modify: `src/app/patient/pages/family-group/family-group-detail.page.html`

(`MatTooltipModule` ya está importado en `family-group-detail.page.ts` — no se toca el `.ts`.)

- [ ] **Step 1: Tooltip on the linkType chip**

In `family-group-detail.page.html`, replace the linkType chip (currently line 25):

```html
                  <span class="chip">{{ m.linkType === 'Dependent' ? 'Dependiente' : 'Registrado' }}</span>
```

with:

```html
                  <span
                    class="chip"
                    [matTooltip]="
                      m.linkType === 'Dependent'
                        ? 'Persona sin cuenta propia; su perfil lo gestionan los administradores del grupo.'
                        : 'Persona con cuenta propia, vinculada por invitación. Debe autorizar el acceso.'
                    "
                  >{{ m.linkType === 'Dependent' ? 'Dependiente' : 'Registrado' }}</span>
```

- [ ] **Step 2: Tooltip on the admin-role chip**

Replace the admin chip block (currently lines 26-30):

```html
                  @if (m.adminRole !== 'None') {
                    <span class="chip chip--admin">
                      {{ m.adminRole === 'Principal' ? 'Principal' : 'Admin' }}
                    </span>
                  }
```

with:

```html
                  @if (m.adminRole !== 'None') {
                    <span
                      class="chip chip--admin"
                      matTooltip="Puede gestionar miembros, invitar y administrar la información del grupo."
                    >
                      {{ m.adminRole === 'Principal' ? 'Principal' : 'Admin' }}
                    </span>
                  }
```

- [ ] **Step 3: Tooltip on the "Agregar miembro" button**

Replace the add-member button (currently lines 14-16):

```html
            <button mat-flat-button color="primary" (click)="openAddMember()">
              <mat-icon>person_add</mat-icon> Agregar miembro
            </button>
```

with:

```html
            <button
              mat-flat-button
              color="primary"
              matTooltip="Agrega un dependiente (sin cuenta) o invita a alguien que ya tiene cuenta."
              (click)="openAddMember()"
            >
              <mat-icon>person_add</mat-icon> Agregar miembro
            </button>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/patient/pages/family-group/family-group-detail.page.html
git commit -m "feat(family-group): explanatory tooltips on member chips and add-member"
```

---

### Task 5: Verificación final (AOT build)

**Files:** none (verification only).

- [ ] **Step 1: Full development build**

Run: `npx ng build --configuration development`
Expected: `Application bundle generation complete.` and exit 0. (A pre-existing unused-`RouterLink` warning in `SearchPageComponent` is unrelated and acceptable.)

- [ ] **Step 2: Confirm the help panel chunk compiled**

Confirm the build output shows no errors referencing `family-group`. If the build is green, the feature is integrated.

- [ ] **Step 3: Manual smoke (optional, if running the app)**

Navigate to `/patient/family-group` (empty + with groups) and `/patient/family-group/requests`: the "¿Cómo funciona?" panel appears collapsed, expands on click, and stays expanded after a reload (localStorage). Hover the chips/button in a group detail to see tooltips.

---

## Self-Review

- **Spec coverage:** ✅ Panel colapsable (Task 1+2+3) · empty states (Task 2 lista, Task 3 invitaciones) · tooltips Dependiente/Registrado/Roles/Agregar miembro (Task 4) · tono tuteo (toda la copy) · SSR-safe + recuerda estado (Task 1) · frontend-only (sin tareas de backend).
- **Placeholder scan:** sin TBD/TODO; todo el código y la copy están completos.
- **Type consistency:** `expanded()` (signal) y `onExpandedChange()` usados igual en componente, template y spec; selector `app-family-group-help-panel` y la ruta de import idénticos en Tasks 2 y 3; `STORAGE_KEY = 'fg-help-panel-expanded'` coincide con la clave usada en el spec.
